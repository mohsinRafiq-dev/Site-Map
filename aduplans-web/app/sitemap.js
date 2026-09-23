import { getAllPlans } from "@/lib/baserow";

const BASE = "https://aduplans.com";

// Refresh hourly so plans JT adds to Baserow appear in the sitemap without a
// redeploy. getAllPlans() runs on the server and already drops Inactive plans,
// so the Baserow token never reaches the browser.
export const revalidate = 3600;

const STATIC = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/plans", changeFrequency: "daily", priority: 1.0 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/plan-fit-visualizer", changeFrequency: "monthly", priority: 0.8 },
  { path: "/cost-estimator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/why-steel", changeFrequency: "monthly", priority: 0.8 },
  { path: "/ask-ai", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap() {
  const now = new Date();
  const staticUrls = STATIC.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  let planUrls = [];
  try {
    const plans = await getAllPlans();
    // No lastModified on plan pages: stamping today's date on thousands of URLs
    // that did not change teaches Google to distrust the field.
    planUrls = plans.map((plan) => ({
      url: `${BASE}/plans/${plan.id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (e) {
    // A Baserow hiccup must not take the whole sitemap down — serve the
    // marketing pages rather than nothing at all.
    console.error("[aduplans] sitemap plan load failed:", e?.message);
  }

  return [...staticUrls, ...planUrls];
}
