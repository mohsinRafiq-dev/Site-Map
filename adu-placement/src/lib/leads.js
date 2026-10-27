import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Save a Build-Ready ADU Placement Request (lead) to Firestore.
// `form` is the customer's answers; `context` is what they were placing
// (plan, lot, location) so the sales team has full picture for follow-up.
//
// Returns the new lead's document ID.
export async function saveLead(form, context) {
  const payload = {
    // ---- Customer answers ----
    name:            form.name?.trim() || "",
    company:         form.company?.trim() || "",
    email:           form.email?.trim() || "",
    phone:           form.phone?.trim() || "",
    county:          form.county?.trim() || "",
    state:           form.state?.trim() || "",
    timeline:        form.timeline || "",
    buildMethod:     form.buildMethod || "",
    financing:       form.financing === "Other" ? `Other: ${form.financingOther?.trim() || ""}` : (form.financing || ""),
    intendedUse:     [
      ...(form.intendedUse || []),
      ...(form.intendedUse?.includes("Other") && form.intendedUseOther?.trim()
        ? [`Other: ${form.intendedUseOther.trim()}`]
        : []),
    ].filter((u) => u !== "Other"),

    // ---- Project context (so sales sees exactly what they placed) ----
    planId:     context.planId || null,
    planName:   context.planName || null,
    planSeries: context.planSeries || null,
    planSqft:   context.planSqft || null,
    address:    context.address || null,
    coordinates: context.coordinates || null,
    lot:        context.lot || null,
    setbacks:   context.setbacks || null,

    // ---- Meta ----
    status:    "new",
    source:    "adu-placement-tool",
    createdAt: serverTimestamp(),
  };

  // Firestore rejects undefined — sanitise.
  const clean = JSON.parse(JSON.stringify(payload, (_, v) => (v === undefined ? null : v)));
  clean.createdAt = serverTimestamp();

  const ref = await addDoc(collection(db, "leads"), clean);

  // Best-effort email notification to the sales team. Never blocks or fails
  // the submission — the Firestore record is the source of truth.
  // Serialisable payload (no Firestore sentinels).
  const lead = { ...clean, createdAt: new Date().toISOString() };
  try {
    if (EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey) {
      await sendViaEmailJS(lead);
    } else {
      // No EmailJS keys (Vercel / local dev) — fall back to the Resend function.
      await fetch("/api/notify-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
    }
  } catch (err) {
    console.warn("[FrameUpNow] Lead email notification failed (lead still saved):", err?.message);
  }

  return ref.id;
}

// EmailJS (https://www.emailjs.com) sends from the browser through a connected
// Gmail/Outlook account, so no server function or verified domain is needed.
// The public key is meant to be public. Recipients are set on the EmailJS
// template itself, never sent from here, so the key can't email anyone else.
// The template is emailjs/lead-notification-template.html; its {{variables}}
// are the keys of leadTemplateParams() below.
const EMAILJS = {
  serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

// Every value is a ready-to-print string; blanks become "—" so the template
// never shows an empty slot.
function leadTemplateParams(lead) {
  const dash = (v) => (v === undefined || v === null || String(v).trim() === "" ? "—" : String(v));
  const ft = (n) => Math.round(Number(n) * 10) / 10;
  const name = (lead.name || "").trim();
  const c = lead.coordinates;
  const hasCoords = c && Number.isFinite(c.lat) && Number.isFinite(c.lng);
  const sb = lead.setbacks;

  // Satellite snapshot of the lot with a pin; falls back to a wide view of
  // California when the lead has no coordinates.
  const [lng, lat, zoom] = hasCoords ? [c.lng, c.lat, 18] : [-119.4, 36.8, 5];
  const pin = hasCoords ? `pin-l+f5a524(${lng},${lat})/` : "";
  const mapImage =
    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
    `${pin}${lng},${lat},${zoom},0/600x300@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
  const mapLink = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address || "")}`;

  return {
    subject:      `ADU Plan Fit Visualizer · New Lead — ${name || "Unknown"}${lead.state ? ` (${lead.state})` : ""}`,
    reply_to:     lead.email || "",
    name:         dash(name),
    first_name:   name.split(/\s+/)[0] || "This customer",
    initials:     name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?",
    email:        dash(lead.email),
    phone:        dash(lead.phone),
    phone_link:   String(lead.phone || "").replace(/[^\d+]/g, ""),
    company:      lead.company || "Homeowner",
    location:     dash([lead.county, lead.state].filter(Boolean).join(", ")),
    timeline:     dash(lead.timeline),
    build_method: dash(lead.buildMethod),
    financing:    dash(lead.financing),
    intended_use: dash((lead.intendedUse || []).join(" · ")),
    plan_name:    lead.planName || (lead.planId ? `Plan ${lead.planId}` : "an ADU plan"),
    plan_series:  dash(lead.planSeries),
    plan_id:      dash(lead.planId),
    plan_sqft:    lead.planSqft ? Number(lead.planSqft).toLocaleString("en-US") : "—",
    lot_size:     lead.lot ? `${ft(lead.lot.width)}×${ft(lead.lot.length)}` : "—",
    setbacks:     sb ? `${sb.front}′ front · ${sb.back}′ back · ${sb.left}′ / ${sb.right}′ sides` : "—",
    address:      dash(lead.address),
    coordinates:  hasCoords ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : "—",
    map_image:    mapImage,
    map_link:     mapLink,
    submitted_at: new Date(lead.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  };
}

async function sendViaEmailJS(lead) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: leadTemplateParams(lead),
    }),
  });
  if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
}
