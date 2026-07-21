export const runtime = "nodejs";

// Receives a contact-form submission and creates a lead in Salesforce.
//
// Preferred path: Salesforce **Web-to-Lead** (no Zapier needed). Set
//   SALESFORCE_ORG_ID          = your Salesforce Org ID (15/18-char, "00D…")
//   SALESFORCE_LEAD_COMPANY    = default Company for the lead (optional; Salesforce
//                                requires Company — defaults to "ADUplans.com Lead")
//   SALESFORCE_WEBTOLEAD_URL   = endpoint (optional; defaults to the standard one)
//
// Fallback path: a Zapier "Catch Hook" webhook, if you'd rather route through
//   Zapier — set ZAPIER_CONTACT_WEBHOOK_URL instead.
//
// If neither is set, the submission is accepted and logged (so the form is
// testable) but NOT sent anywhere.

const WEBTOLEAD_URL =
  process.env.SALESFORCE_WEBTOLEAD_URL ||
  "https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8";

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

// Salesforce Web-to-Lead rejects phones outside 9–15 digits and is finicky about
// formatting/country codes. Send clean digits: drop a leading US "1" so a normal
// 10-digit US number is used (e.g. "1 (623) 759-1378" → "6237591378").
function normalizePhone(raw) {
  let d = (raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d;
}

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const fullName = (data.fullName || "").trim();
  const phone = (data.phone || "").trim();
  const email = (data.email || "").trim();
  const subject = (data.subject || "").trim();
  const message = (data.message || "").trim();

  if (!fullName || !phone || !email || !subject || !message) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const orgId = process.env.SALESFORCE_ORG_ID;
  const zapierHook = process.env.ZAPIER_CONTACT_WEBHOOK_URL;

  // ── 1) Salesforce Web-to-Lead (preferred) ─────────────────────────────────
  if (orgId) {
    const { first, last } = splitName(fullName);
    const params = new URLSearchParams({
      oid: orgId,
      first_name: first,
      last_name: last || fullName, // Salesforce requires Last Name
      email,
      phone: normalizePhone(phone),
      company: process.env.SALESFORCE_LEAD_COMPANY || "ADUplans.com Lead",
      lead_source: "aduplans.com",
      // Subject isn't a standard Lead field — fold it into the description.
      description: `Subject: ${subject}\n\n${message}`,
    });
    try {
      // Web-to-Lead always returns 200 and doesn't report validation errors in
      // the response, so a network failure is the only thing we can detect.
      await fetch(WEBTOLEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      return Response.json({ ok: true });
    } catch (e) {
      console.error("[contact] Salesforce Web-to-Lead failed:", e?.message);
      return Response.json(
        { error: "We couldn't send your message right now. Please try again shortly." },
        { status: 502 }
      );
    }
  }

  // ── 2) Zapier Catch Hook (fallback) ───────────────────────────────────────
  const payload = {
    fullName,
    phone,
    email,
    subject,
    message,
    source: "aduplans.com",
    submittedAt: new Date().toISOString(),
  };
  if (zapierHook) {
    try {
      const res = await fetch(zapierHook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`webhook responded ${res.status}`);
      return Response.json({ ok: true });
    } catch (e) {
      console.error("[contact] Zapier webhook forward failed:", e?.message);
      return Response.json(
        { error: "We couldn't send your message right now. Please try again shortly." },
        { status: 502 }
      );
    }
  }

  // ── 3) Nothing configured yet — accept + log (form stays testable) ────────
  console.warn(
    "[contact] No lead destination configured (set SALESFORCE_ORG_ID or " +
      "ZAPIER_CONTACT_WEBHOOK_URL) — submission NOT sent:",
    JSON.stringify(payload)
  );
  return Response.json({ ok: true });
}
