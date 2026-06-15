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
  try {
    await fetch("/api/notify-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send the serialisable payload (no Firestore sentinels).
      body: JSON.stringify({ ...clean, createdAt: new Date().toISOString() }),
    });
  } catch (err) {
    console.warn("[FrameUpNow] Lead email notification failed (lead still saved):", err?.message);
  }

  return ref.id;
}
