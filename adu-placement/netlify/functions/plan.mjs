// Netlify function — GET /api/plan?id=<PlanID>. The lookup itself lives in
// api/plan.js so Netlify, Vercel and the Vite dev server share one copy.
import { lookupPlan } from "../../api/plan.js";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  const { status, body, cacheControl } = await lookupPlan(id);
  const headers = cacheControl ? { "Cache-Control": cacheControl } : {};
  return Response.json(body, { status, headers });
};

export const config = { path: "/api/plan" };
