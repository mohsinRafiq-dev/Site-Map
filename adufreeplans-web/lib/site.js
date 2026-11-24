// This website's public address, and links into the Plan Fit Visualizer that
// say which website they came from. The tool reads ?src= (and ?from=, the page
// the visitor was on) so every lead email shows where the customer started.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://houseplansfree.com";
const SITE_KEY = "houseplansfree"; // the ?src= value the Plan Fit Visualizer recognises
const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:5173";

export const planPageUrl = (id) => `${SITE_URL}/plans/${encodeURIComponent(id)}`;

// toolUrl() → the tool's home; toolUrl({ plan: "00184", … }) → deep link.
export function toolUrl(params = {}) {
  const q = new URLSearchParams(params);
  q.set("src", SITE_KEY);
  return `${TOOL_URL}/?${q.toString()}`;
}
