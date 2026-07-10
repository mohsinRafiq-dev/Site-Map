"use client";

const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:5173";

export default function PlaceOnLotButton({ plan, large = false }) {
  // Pass the plan's data in the URL so the tool doesn't need to re-fetch it
  // from Baserow (no token/CORS/env dependency — it just works).
  const q = new URLSearchParams();
  q.set("plan", plan.id);
  if (plan.lotImage) q.set("img", plan.lotImage);
  if (plan.width) q.set("w", String(plan.width));
  if (plan.depth) q.set("d", String(plan.depth));
  if (plan.sqft) q.set("sqft", String(plan.sqft));
  if (plan.displayName) q.set("name", plan.displayName);
  if (plan.jurisdiction) q.set("series", plan.jurisdiction);
  const href = `${TOOL_URL}/?${q.toString()}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center justify-center gap-2.5 rounded-full bg-forest font-semibold text-white shadow-lg transition-all hover:bg-forest-600 hover:-translate-y-0.5 ${
        large ? "px-7 py-4 text-base w-full sm:w-auto" : "px-5 py-2.5 text-sm"
      }`}
    >
      <svg viewBox="0 0 24 24" width={large ? 20 : 17} height={large ? 20 : 17} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
      Place this floor plan on my lot
      <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
    </a>
  );
}
