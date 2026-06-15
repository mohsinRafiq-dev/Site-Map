// Vercel serverless function — emails the sales team when a new Build-Ready
// ADU Placement Request is submitted. Uses Resend (https://resend.com).
//
// Required Vercel environment variables:
//   RESEND_API_KEY    — your Resend API key
//   LEAD_NOTIFY_TO    — comma-separated recipients (your testing email now,
//                       "bsendele@frameupnow.com,rford@frameupnow.com" later)
//   LEAD_NOTIFY_FROM  — sender ("onboarding@resend.dev" for testing, or a
//                       verified-domain address like "leads@frameupnow.com")
//
// The same logic runs on localhost via the Vite dev middleware (vite.config.js).

import { sendLeadEmail } from "./_leadEmail.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let lead;
  try {
    lead = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid body" });
  }

  const result = await sendLeadEmail(lead, {
    apiKey: process.env.RESEND_API_KEY,
    to: process.env.LEAD_NOTIFY_TO,
    from: process.env.LEAD_NOTIFY_FROM,
  });

  if (!result.ok) {
    console.error("[notify-lead]", result.error);
    return res.status(500).json({ error: result.error });
  }
  return res.status(200).json({ ok: true });
}
