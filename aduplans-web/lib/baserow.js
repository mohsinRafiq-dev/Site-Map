// ─────────────────────────────────────────────────────────────────────────────
// Baserow data layer (server-side)
//
// This is the caching layer we promised the team: the browser NEVER talks to
// Baserow. Every plan page reads a cached, server-fetched snapshot, so:
//   • the API token stays on the server (never in the browser),
//   • visitor traffic generates ZERO live Baserow requests (well under the
//     10-concurrent Cloud limit),
//   • a brief Baserow outage doesn't take the site down — we serve the cache.
//
// We fetch all plans once (sequentially, in pages), cache them with Next's data
// cache (revalidated periodically), then filter / sort / paginate in memory.
// ─────────────────────────────────────────────────────────────────────────────

import { cache } from "react";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const TOKEN = process.env.BASEROW_TOKEN;
const TABLE = process.env.BASEROW_TABLE_ID || "523542";
const API = "https://api.baserow.io/api/database/rows/table";
const REVALIDATE = 300; // seconds — refresh the cached catalog every 5 minutes

// ── Parsers ──────────────────────────────────────────────────────────────────

// "00022_25x28.png" / "00025_35x28.6.png" → { width, depth } (feet). x/X/×.
function parseDims(name) {
  if (!name) return null;
  const m = name.match(/_([\d.]+)\s*[x×X]\s*([\d.]+)\s*\.png$/i);
  if (!m) return null;
  const width = parseFloat(m[1]);
  const depth = parseFloat(m[2]);
  return width && depth ? { width, depth } : null;
}

// "Studio 1 Bath" → { beds:0, baths:1, bedsLabel:"Studio" }; "3 Bed 2 Bath" → {3,2}
function parseBedsBaths(label) {
  if (!label) return { beds: null, baths: null, bedsLabel: "See plan" };
  const bath = label.match(/([\d.]+)\s*Bath/i);
  const baths = bath ? parseFloat(bath[1]) : null;
  if (/studio/i.test(label)) return { beds: 0, baths: baths ?? 1, bedsLabel: "Studio" };
  const bed = label.match(/(\d+)\s*Bed/i);
  const beds = bed ? parseInt(bed[1], 10) : null;
  return { beds, baths, bedsLabel: beds != null ? `${beds} Bed` : "See plan" };
}

const sel = (v) => (v && typeof v === "object" ? v.value : v);
const fileUrl = (arr) => (arr && arr[0] ? arr[0].url : null);
const fileName = (arr) => (arr && arr[0] ? arr[0].visible_name || arr[0].name : null);
// Small CDN thumbnail for fast card grids (full image only loads on detail).
const fileThumb = (arr) => {
  const f = arr && arr[0];
  return f?.thumbnails?.card_cover?.url || f?.thumbnails?.small?.url || f?.url || null;
};

// Baserow row (user_field_names=true) → clean plan object for the UI.
function normalize(row) {
  const lotFile = (row["Lot-Specific Floor Plans"] || [])[0];
  const dims = lotFile ? parseDims(lotFile.visible_name || lotFile.name) : null;
  const fp = parseBedsBaths(sel(row["Floor-plan"]));
  const sqft = parseInt(row["Sq-Ft"], 10) || (dims ? Math.round(dims.width * dims.depth) : null);

  const style = (row["Elevation Style or Name"] || "").trim();
  const planId = String(row["Plan ID"] ?? "").trim();
  // A clean, user-friendly title: the plan's style name (e.g. "Casa Mini"),
  // never the raw "Name of Home" formula string.
  const displayName = style || (fp.bedsLabel !== "See plan" ? `${fp.bedsLabel} ADU` : `Plan ${planId}`);

  return {
    id: planId,
    name: (row["Name of Home"] || style || `Plan ${planId}`).trim(), // used for search
    displayName,
    style,
    state: sel(row["State"]) || "",
    jurisdiction: row["Jurisdiction"] || "",
    county: row["County"] || "",
    sqft,
    beds: fp.beds,
    baths: fp.baths,
    bedsLabel: fp.bedsLabel,
    floorPlanLabel: sel(row["Floor-plan"]) || "",
    stories: sel(row["1-or-2-Story"]) === "2-Story" ? 2 : 1,
    garage: /yes/i.test(sel(row["Garage"]) || ""),
    loft: /yes/i.test(sel(row["Loft"]) || ""),
    architect: row["Architect/Designer"] || "",
    payment: sel(row["Payment-to-Acquire-Plan"]) || "",
    sectionCode: row["Section code"] || "",
    pradUrl: row["PRADU Jurisdiction URL"] || "",
    elevationImage: fileUrl(row["Elevation image"]),
    floorPlanImage: fileUrl(row["Floorplan-image"]),
    // Lightweight thumbnail used by cards/grids for fast loading.
    cardImage:
      fileThumb(row["Elevation image"]) ||
      fileThumb(row["Floorplan-image"]) ||
      (lotFile ? lotFile.url : null),
    lotImage: lotFile ? lotFile.url : null,
    lotImageName: fileName(row["Lot-Specific Floor Plans"]),
    width: dims?.width ?? null,
    depth: dims?.depth ?? null,
    placeable: !!(lotFile && dims), // can be placed on a lot in the tool
  };
}

// ── Fetch + cache ────────────────────────────────────────────────────────────

async function fetchPage(page, size = 200, attempt = 0) {
  const url = `${API}/${TABLE}/?user_field_names=true&size=${size}&page=${page}`;
  const res = await fetch(url, {
    headers: { Authorization: `Token ${TOKEN}` },
    // Vercel's Data Cache persists across serverless invocations (the in-memory
    // cache below does not survive cold starts), so production stays fast.
    next: { revalidate: REVALIDATE, tags: ["plans"] },
  });
  // Baserow Cloud fair-use returns 429 when too many requests overlap — back
  // off and retry a few times before giving up.
  if (res.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    return fetchPage(page, size, attempt + 1);
  }
  if (!res.ok) throw new Error(`Baserow HTTP ${res.status}`);
  return res.json();
}

// Fetch every plan, normalized. Page 1 gives the total; the rest are fetched
// in small PARALLEL batches (6 at a time — well under Baserow Cloud's
// 10-concurrent limit), turning ~24 slow sequential requests into a few fast
// rounds.
async function fetchAllPlans() {
  const first = await fetchPage(1);
  const total = first.count ?? first.results.length;
  const pages = Math.max(1, Math.ceil(total / 200));
  const rows = [...first.results];

  const remaining = [];
  for (let p = 2; p <= pages; p++) remaining.push(p);

  const BATCH = 4; // stay comfortably under Baserow Cloud's 10-concurrent limit
  for (let i = 0; i < remaining.length; i += BATCH) {
    const batch = await Promise.all(remaining.slice(i, i + BATCH).map((p) => fetchPage(p)));
    for (const b of batch) rows.push(...b.results);
  }
  return rows.map(normalize);
}

// ── In-memory catalog cache (stale-while-revalidate) ─────────────────────────
// Baserow Cloud is slow (~1.8s/request × 24 pages ≈ 8s), so we assemble the
// catalog ONCE and keep it in memory. Only the very first load ever waits;
// afterwards every request gets the cached list instantly, and once it goes
// stale a refresh runs in the BACKGROUND (users never wait for it).
let _memo = null; // { at: number, data: Plan[] }
let _refreshing = null;

// Build-time snapshot (scripts/snapshot.js) of the whole catalog, already
// normalized and gzipped. We seed the in-memory cache with it at startup so:
//   • a cold serverless instance serves real data INSTANTLY (no 8s Baserow
//     wait) while it refreshes live data in the background, and
//   • if Baserow is unreachable, we keep serving this last-good snapshot
//     instead of an empty site.
function loadSnapshot() {
  try {
    const file = path.join(process.cwd(), "lib", "plans-snapshot.json.gz");
    const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
    return Array.isArray(data) && data.length ? data : null;
  } catch {
    return null; // no snapshot yet (e.g. local dev before a build) — fine
  }
}

// Seed as STALE (at: 0) so the very first request serves it immediately and
// still triggers a background refresh to pull the latest live data.
const _snapshot = loadSnapshot();
if (_snapshot) _memo = { at: 0, data: _snapshot };

async function refresh() {
  const data = await fetchAllPlans();
  _memo = { at: Date.now(), data };
  return data;
}

async function loadPlans() {
  // Fresh cache → return immediately.
  if (_memo && Date.now() - _memo.at < REVALIDATE * 1000) return _memo.data;

  // Single-flight: only ONE refresh runs at a time. Concurrent callers share it
  // instead of each firing their own 24-request fetch (which tripped Baserow's
  // rate limit).
  if (!_refreshing) {
    _refreshing = refresh().finally(() => { _refreshing = null; });
  }

  // Have stale data? Serve it now; the refresh completes in the background.
  if (_memo) {
    _refreshing.catch(() => {}); // don't let a bg failure crash the request
    return _memo.data;
  }

  // No data yet (cold start) — everyone awaits the same in-flight fetch.
  try {
    return await _refreshing;
  } catch (e) {
    if (_memo) return _memo.data;
    // Never crash the whole page render on a data hiccup — fall back to the
    // build-time snapshot, or an empty catalog as a last resort. Check the
    // deployment's Runtime Logs for the real cause (e.g. a missing
    // BASEROW_TOKEN shows as "Baserow HTTP 401").
    console.error("[aduplans] plan load failed:", e?.message);
    return _snapshot || [];
  }
}

// Dedupe within a single render with React cache().
export const getAllPlans = cache(loadPlans);

// Warm the cache as soon as this module loads on the server, so the ~8s fetch
// happens in the background before the first visitor arrives.
if (TOKEN) loadPlans().catch(() => {});

// A single plan by its Baserow "Plan ID" (e.g. "00022").
export async function getPlanById(id) {
  const target = String(id).trim();
  const plans = await getAllPlans();
  return plans.find((p) => p.id === target) || null;
}

// ── Facets + filtering (in memory) ───────────────────────────────────────────

// Distinct filter options derived from the live data.
export function buildFacets(plans) {
  const states = {};
  const bedOpts = new Set();
  const bathOpts = new Set();
  let sqMin = Infinity;
  let sqMax = 0;
  for (const p of plans) {
    if (p.state) states[p.state] = (states[p.state] || 0) + 1;
    if (p.beds != null) bedOpts.add(p.beds);
    if (p.baths != null) bathOpts.add(p.baths);
    if (p.sqft) {
      sqMin = Math.min(sqMin, p.sqft);
      sqMax = Math.max(sqMax, p.sqft);
    }
  }
  return {
    states: Object.entries(states).sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count })),
    beds: [...bedOpts].sort((a, b) => a - b),
    baths: [...bathOpts].sort((a, b) => a - b),
    sqftMin: Number.isFinite(sqMin) ? sqMin : 0,
    sqftMax: sqMax,
  };
}

// Apply the catalog filters (from URL search params) to the plan list.
export function filterPlans(plans, f = {}) {
  const yes = (v) => v === true || v === "yes" || v === "1";
  const no = (v) => v === "no" || v === "0";
  return plans.filter((p) => {
    if (f.placeable && !p.placeable) return false;
    if (f.state && p.state !== f.state) return false;
    if (f.architect && p.architect !== f.architect) return false;
    if (f.floorPlan && p.floorPlanLabel !== f.floorPlan) return false;
    if (f.beds != null && p.beds !== Number(f.beds)) return false;
    if (f.baths != null && p.baths !== Number(f.baths)) return false;
    if (f.stories && p.stories !== Number(f.stories)) return false;
    if (f.garage != null && f.garage !== "") {
      if (yes(f.garage) && !p.garage) return false;
      if (no(f.garage) && p.garage) return false;
    }
    if (f.loft != null && f.loft !== "") {
      if (yes(f.loft) && !p.loft) return false;
      if (no(f.loft) && p.loft) return false;
    }
    if (f.sqftMin && (p.sqft ?? 0) < Number(f.sqftMin)) return false;
    if (f.sqftMax && (p.sqft ?? 1e9) > Number(f.sqftMax)) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${p.name} ${p.jurisdiction} ${p.county} ${p.state} ${p.style} ${p.id} ${p.architect}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
