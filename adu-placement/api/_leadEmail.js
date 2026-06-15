// Shared lead-email logic, used by BOTH the Vercel serverless function
// (api/notify-lead.js) and the Vite dev middleware (vite.config.js) so
// emails work on localhost AND in production with one implementation.
//
// Files in /api prefixed with "_" are NOT turned into routes by Vercel.

function esc(s) {
  return String(s ?? "—").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

export function buildLeadHtml(lead) {
  const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const has = (v) => v !== undefined && v !== null && String(v).trim() !== "";

  // One label/value line inside a section card
  const row = (label, value, opts = {}) => {
    if (!has(value)) return "";
    const valStyle = opts.mono
      ? "font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px"
      : "font-size:14px";
    return `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #eef1ec;color:#5b6b58;font-size:13px;width:42%;vertical-align:top">${label}</td>
        <td style="padding:9px 0;border-bottom:1px solid #eef1ec;color:#16261c;font-weight:600;${valStyle};text-align:right;vertical-align:top">${esc(value)}</td>
      </tr>`;
  };

  // A titled section card
  const card = (title, rowsHtml) => {
    if (!rowsHtml.trim()) return "";
    return `
      <tr><td style="padding:0 28px">
        <div style="margin:18px 0 8px;color:#2f5c2a;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase">${title}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rowsHtml}</table>
      </td></tr>`;
  };

  const uses = Array.isArray(lead.intendedUse) ? lead.intendedUse.filter(Boolean) : (has(lead.intendedUse) ? [lead.intendedUse] : []);
  const usesChips = uses.length
    ? uses.map((u) =>
        `<span style="display:inline-block;background:#eaf5e6;color:#2f5c2a;border:1px solid #cfe6c5;border-radius:999px;padding:4px 11px;font-size:12px;font-weight:600;margin:0 6px 6px 0">${esc(u)}</span>`
      ).join("")
    : "";
  const coords = lead.coordinates ? `${lead.coordinates.lat?.toFixed?.(5)}, ${lead.coordinates.lng?.toFixed?.(5)}` : "";
  const lot = lead.lot ? `${lead.lot.width}' × ${lead.lot.length}'` : "";
  const planLine = lead.planName ? `${lead.planName}${lead.planSeries ? " · " + lead.planSeries : ""}` : (lead.planId || "");
  const initials = (lead.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const submitted = lead.createdAt ? new Date(lead.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : new Date().toLocaleString();

  const contact = row("Email", lead.email) + row("Phone", lead.phone) + row("Company", lead.company)
    + row("County", lead.county) + row("State", lead.state);
  const project = row("Build timeline", lead.timeline) + row("Build method", lead.buildMethod) + row("Financing", lead.financing);
  const planLot = row("Plan", planLine) + row("Plan size", has(lead.planSqft) ? `${lead.planSqft} sq ft` : "")
    + row("Address", lead.address) + row("Lot dimensions", lot) + row("Coordinates", coords, { mono: true });

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef1ea;">
  <span style="display:none;font-size:1px;color:#eef1ea;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">New ADU lead${has(lead.name) ? " from " + esc(lead.name) : ""}${has(lead.timeline) ? " · " + esc(lead.timeline) : ""}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1ea;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(31,58,28,0.12)">

        <!-- Header -->
        <tr><td style="background:#1f3a1c;background:linear-gradient(135deg,#142512,#274a22);padding:26px 28px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:13px;font-weight:800;letter-spacing:.14em;color:#9fd6a0;text-transform:uppercase;font-family:${FONT}">▲ FrameUpNow</td>
            <td align="right"><span style="display:inline-block;background:#22c55e;color:#04130b;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;font-family:${FONT}">New Lead</span></td>
          </tr></table>
          <div style="margin-top:14px;font-size:22px;font-weight:800;color:#ffffff;font-family:${FONT};letter-spacing:-.01em">Build-Ready ADU Placement Request</div>
          <div style="margin-top:4px;font-size:13px;color:#bcd5b2;font-family:${FONT}">A potential customer placed a plan and is ready for follow-up.</div>
        </td></tr>

        <!-- Customer hero -->
        <tr><td style="padding:24px 28px 4px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle">
              <div style="width:52px;height:52px;border-radius:50%;background:#e6f1e3;color:#2f5c2a;font-family:${FONT};font-weight:800;font-size:18px;text-align:center;line-height:52px">${esc(initials)}</div>
            </td>
            <td style="vertical-align:middle;padding-left:14px">
              <div style="font-size:19px;font-weight:800;color:#16261c;font-family:${FONT}">${esc(lead.name || "New lead")}</div>
              <div style="font-size:13px;color:#5b6b58;font-family:${FONT}">${esc([lead.county, lead.state].filter(has).join(", ") || "Location not provided")}</div>
            </td>
          </tr></table>
          ${has(lead.timeline) ? `<div style="margin-top:14px"><span style="display:inline-block;background:#fff5e0;color:#8a5a00;border:1px solid #f2dca6;border-radius:999px;padding:6px 14px;font-size:12.5px;font-weight:700;font-family:${FONT}">⏱ ${esc(lead.timeline)}</span></div>` : ""}
        </td></tr>

        <!-- Quick actions -->
        <tr><td style="padding:18px 28px 4px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            ${has(lead.email) ? `<td style="padding-right:10px"><a href="mailto:${esc(lead.email)}" style="display:inline-block;background:#2f5c2a;color:#ffffff;font-family:${FONT};font-size:14px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:10px">✉ Email ${esc((lead.name || "lead").split(" ")[0])}</a></td>` : ""}
            ${has(lead.phone) ? `<td><a href="tel:${esc(lead.phone)}" style="display:inline-block;background:#eaf5e6;color:#2f5c2a;font-family:${FONT};font-size:14px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:10px;border:1px solid #cfe6c5">📞 Call</a></td>` : ""}
          </tr></table>
        </td></tr>

        ${card("Contact", contact)}
        ${card("Project", project)}
        ${usesChips ? `<tr><td style="padding:14px 28px 0"><div style="color:#2f5c2a;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-bottom:8px">Intended use</div>${usesChips}</td></tr>` : ""}
        ${card("Plan & lot", planLot)}

        <!-- Footer -->
        <tr><td style="padding:22px 28px 26px">
          <div style="border-top:1px solid #eef1ec;padding-top:16px;color:#8a958a;font-size:12px;font-family:${FONT}">
            Submitted ${esc(submitted)} via the FrameUpNow ADU Placement Tool.<br>
            Reply directly to this email to reach the customer.
          </div>
        </td></tr>

      </table>
      <div style="font-size:11px;color:#9aa79a;font-family:${FONT};margin-top:14px">FrameUpNow · Build-Ready ADU Placement</div>
    </td></tr>
  </table>
</body></html>`;
}

// Sends the lead email via Resend. Returns { ok: true } or { ok: false, error }.
export async function sendLeadEmail(lead, { apiKey, to, from }) {
  const recipients = Array.isArray(to) ? to : String(to || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || recipients.length === 0) {
    return { ok: false, error: "Email not configured (missing RESEND_API_KEY or LEAD_NOTIFY_TO)" };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `FrameUpNow Leads <${from || "onboarding@resend.dev"}>`,
        to: recipients,
        reply_to: lead.email || undefined,
        subject: `New ADU Lead — ${lead.name || "Unknown"}${lead.state ? ` (${lead.state})` : ""}`,
        html: buildLeadHtml(lead),
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      return { ok: false, error: `Resend ${r.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
