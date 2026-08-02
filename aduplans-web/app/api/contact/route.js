export const runtime = "nodejs";

import {
  LIMITS,
  normalizePhone,
  splitName,
  validateContact,
} from "@/lib/contactValidation";

// Creates a Salesforce Lead from the contact form via Web-to-Lead.
//
// Configuration (set these in the Vercel project's Environment Variables, for
// both Production and Preview — .env.local only covers local dev):
//   SALESFORCE_ORG_ID        required. The 15/18-char Org ID, "00D…".
//   SALESFORCE_LEAD_COMPANY  optional. Salesforce requires Company on a Lead;
//                            defaults to "ADUplans.com Lead".
//   SALESFORCE_WEBTOLEAD_URL optional. Override the endpoint (sandbox testing).
//
// Why validation is so strict here: Web-to-Lead replies HTTP 200 with an empty
// body whether it accepted the lead or binned it. There is no success signal to
// read. So anything Salesforce would reject has to be caught before we post it,
// otherwise the customer sees "thank you" and the lead quietly evaporates —
// which is exactly what produced the run of "Salesforce Could Not Create This
// Lead" emails: submissions whose phone fell outside Salesforce's 9–15 digit
// rule were forwarded blindly.
const WEBTOLEAD_URL =
  process.env.SALESFORCE_WEBTOLEAD_URL ||
  "https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8";

// Web-to-Lead has no SLA worth relying on; don't let a wedged endpoint hold the
// serverless function open until the platform kills it.
const TIMEOUT_MS = 10_000;

// Per-IP throttle. In-memory, so it resets on cold start and each Vercel
// instance counts separately — enough to blunt a bot loop, not a replacement
// for a WAF rule if the spam gets serious.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW_MS) {
    // Bound the map so a spray of spoofed IPs can't grow it without limit.
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_MAX;
}

function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot. The field is hidden from people and from assistive tech, so
  // anything in it came from a bot filling every input it found. Answer 200 so
  // the bot records a success and moves on instead of retrying variations.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many messages from this connection. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  // Same function the form ran on the client — re-run because the client is not
  // a trust boundary, and direct POSTs to this route skip the form entirely.
  const errors = validateContact(data);
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 400 });
  }

  const orgId = process.env.SALESFORCE_ORG_ID;
  if (!orgId) {
    // Misconfiguration, not user error. Never answer ok — that would silently
    // drop a real lead, the exact failure mode this rewrite exists to remove.
    console.error(
      "[contact] SALESFORCE_ORG_ID is not set — lead NOT delivered. " +
        "Add it to the Vercel project's environment variables."
    );
    return Response.json(
      { error: "Our contact system is temporarily unavailable. Please email us directly." },
      { status: 503 }
    );
  }

  const fullName = data.fullName.trim();
  const { first, last } = splitName(fullName);
  const subject = data.subject.trim();
  const message = data.message.trim();

  const params = new URLSearchParams({
    oid: orgId,
    first_name: first.slice(0, LIMITS.firstName),
    last_name: (last || fullName).slice(0, LIMITS.lastName),
    email: data.email.trim().slice(0, LIMITS.email),
    phone: normalizePhone(data.phone).slice(0, LIMITS.phone),
    company: (process.env.SALESFORCE_LEAD_COMPANY || "ADUplans.com Lead").slice(0, 255),
    // Lead Source is a picklist. "aduplans.com" must exist as a value on the
    // Lead Source field in the org, or Salesforce discards the value.
    lead_source: "aduplans.com",
    // Lead has no Subject field, so it goes at the top of the description.
    description: `Subject: ${subject}\n\n${message}`,
  });

  try {
    const res = await fetch(WEBTOLEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // A non-2xx here means the request never reached Web-to-Lead properly (bad
    // endpoint, Salesforce outage). A 2xx means it was accepted for processing
    // — not that a Lead was created. See the note at the top of this file.
    if (!res.ok) {
      console.error(`[contact] Web-to-Lead returned HTTP ${res.status} for ${ip}`);
      return Response.json(
        { error: "We couldn't send your message right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    const reason = e?.name === "TimeoutError" ? "timed out" : e?.message;
    console.error(`[contact] Web-to-Lead request failed (${reason})`);
    return Response.json(
      { error: "We couldn't send your message right now. Please try again shortly." },
      { status: 502 }
    );
  }
}
