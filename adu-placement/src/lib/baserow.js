// Deep-link plan lookup.
//
// Powers the "See This Plan on Your Property" button on aduplans.com and
// frameupnow.com: a customer clicks it on a plan and lands on the tool at
// ?plan=<PlanID>. We resolve that ID through our own /api/plan endpoint, which
// queries Baserow server-side and returns the plan already shaped the way the
// wizard and map expect, so it places to scale immediately.
//
// The Baserow token deliberately does NOT live here. A VITE_ variable is
// inlined into the browser bundle, which would hand every visitor read/write
// access to the plans table — so the token stays in BASEROW_TOKEN on the
// server and the browser only ever sees the resolved plan.

// Fetch one plan by its Baserow "Plan ID" (e.g. "00022"). Returns a normalized
// plan object, or null if it isn't found / has no to-scale floor plan.
export async function fetchPlanById(planId) {
  const id = String(planId ?? "").trim();
  if (!id) return null;

  const res = await fetch(`/api/plan?id=${encodeURIComponent(id)}`);
  if (res.status === 404) return null; // not placeable — caller falls back
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error || "";
    } catch {
      /* non-JSON error body — the status is enough */
    }
    throw new Error(detail || `plan lookup failed (HTTP ${res.status})`);
  }
  return res.json();
}
