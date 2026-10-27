import { normalizePhone } from "@/lib/contactValidation";

// Emails the team a copy of each contact-form message via EmailJS
// (https://www.emailjs.com), alongside the Salesforce Lead that /api/contact
// creates. EmailJS sends from the browser through a connected Gmail account,
// so there's no server code or verified domain to look after.
//
// The public key is meant to be public. Recipients are set on the EmailJS
// template itself, never sent from here, so the key can't email anyone else.
// The template is emailjs/contact-message-template.html; its {{variables}} are
// the keys of template_params below.
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

// Returns true if the email was sent. Never throws — the form decides what a
// failure means. `savedToSalesforce` is false when the email is the only copy,
// so the team knows to enter the lead by hand.
export async function sendContactEmail(data, { savedToSalesforce }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return false;
  // Honeypot filled → a bot. /api/contact quietly drops these; so do we.
  if (typeof data.website === "string" && data.website.trim() !== "") return false;

  const name = (data.fullName || "").trim();
  const email = (data.email || "").trim();

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          email_subject: `aduplans.com · New Message — ${name || "Unknown"}`,
          reply_to: email,
          name: name || "—",
          first_name: name.split(/\s+/)[0] || "this visitor",
          initials: name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?",
          email: email || "—",
          phone: (data.phone || "").trim() || "—",
          phone_link: normalizePhone(data.phone || ""),
          topic: (data.subject || "").trim() || "—",
          message: (data.message || "").trim() || "—",
          page_url: window.location.href,
          salesforce_badge: savedToSalesforce ? "✓ Saved to Salesforce" : "⚠ Not in Salesforce",
          salesforce_note: savedToSalesforce
            ? "Created as a Lead · Lead Source aduplans.com"
            : "Salesforce was unavailable — please add this lead by hand",
          submitted_at: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        },
      }),
    });
    if (!res.ok) console.warn("[contact] EmailJS", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.warn("[contact] EmailJS failed:", err?.message);
    return false;
  }
}
