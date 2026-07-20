// Build-time catalog snapshot.
//
// Fetches every Baserow plan row, NORMALIZES it, and writes a gzipped snapshot
// to lib/plans-snapshot.json.gz. lib/baserow.js seeds its in-memory cache from
// this snapshot at startup, so the snapshot serves two purposes:
//   1. INSTANT cold start — a fresh serverless instance serves the snapshot
//      immediately while live Baserow data refreshes in the background (no 8s
//      wait), and
//   2. OUTAGE fallback — if Baserow is unreachable, we serve the last good
//      snapshot instead of an empty site.
//
// The file is generated at build (not committed) and included in the serverless
// bundle via `outputFileTracingIncludes` in next.config.js. This script NEVER
// fails the build: on any error it leaves any existing snapshot untouched.
//
// ⚠ The normalize() below MUST stay in sync with lib/baserow.js normalize().

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "lib", "plans-snapshot.json.gz");
const API = "https://api.baserow.io/api/database/rows/table";

function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — fine on Vercel */
  }
}

// ── normalize (mirror of lib/baserow.js) ─────────────────────────────────────
function parseDims(name) {
  if (!name) return null;
  const m = name.match(/_([\d.]+)\s*[x×X]\s*([\d.]+)\s*\.png$/i);
  if (!m) return null;
  const width = parseFloat(m[1]);
  const depth = parseFloat(m[2]);
  return width && depth ? { width, depth } : null;
}
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
const fileThumb = (arr) => {
  const f = arr && arr[0];
  return f?.thumbnails?.card_cover?.url || f?.thumbnails?.small?.url || f?.url || null;
};
function normalize(row) {
  const lotFile = (row["Lot-Specific Floor Plans"] || [])[0];
  const dims = lotFile ? parseDims(lotFile.visible_name || lotFile.name) : null;
  const fp = parseBedsBaths(sel(row["Floor-plan"]));
  const sqft = parseInt(row["Sq-Ft"], 10) || (dims ? Math.round(dims.width * dims.depth) : null);
  const style = (row["Elevation Style or Name"] || "").trim();
  const planId = String(row["Plan ID"] ?? "").trim();
  const displayName = style || (fp.bedsLabel !== "See plan" ? `${fp.bedsLabel} ADU` : `Plan ${planId}`);
  return {
    id: planId,
    name: (row["Name of Home"] || style || `Plan ${planId}`).trim(),
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
    status: sel(row["Status"]) || "", // Baserow Active/Inactive flag
    sectionCode: row["Section code"] || "",
    pradUrl: row["PRADU Jurisdiction URL"] || "",
    elevationImage: fileUrl(row["Elevation image"]),
    floorPlanImage: fileUrl(row["Floorplan-image"]),
    cardImage:
      fileThumb(row["Elevation image"]) ||
      fileThumb(row["Floorplan-image"]) ||
      (lotFile ? lotFile.url : null),
    lotImage: lotFile ? lotFile.url : null,
    lotImageName: fileName(row["Lot-Specific Floor Plans"]),
    width: dims?.width ?? null,
    depth: dims?.depth ?? null,
    placeable: !!(lotFile && dims),
  };
}

// ── fetch ────────────────────────────────────────────────────────────────────
async function fetchPage(token, table, page, size = 200, attempt = 0) {
  const res = await fetch(`${API}/${table}/?user_field_names=true&size=${size}&page=${page}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    return fetchPage(token, table, page, size, attempt + 1);
  }
  if (!res.ok) throw new Error(`Baserow HTTP ${res.status}`);
  return res.json();
}
async function fetchAllRows(token, table) {
  const first = await fetchPage(token, table, 1);
  const total = first.count ?? first.results.length;
  const pages = Math.max(1, Math.ceil(total / 200));
  const rows = [...first.results];
  const remaining = [];
  for (let p = 2; p <= pages; p++) remaining.push(p);
  const BATCH = 4;
  for (let i = 0; i < remaining.length; i += BATCH) {
    const batch = await Promise.all(remaining.slice(i, i + BATCH).map((p) => fetchPage(token, table, p)));
    for (const b of batch) rows.push(...b.results);
  }
  return rows;
}

async function main() {
  loadEnv();
  const token = process.env.BASEROW_TOKEN;
  const table = process.env.BASEROW_TABLE_ID || "523542";
  if (!token) {
    console.warn("[snapshot] BASEROW_TOKEN not set — keeping existing snapshot.");
    return;
  }
  try {
    const rows = await fetchAllRows(token, table);
    if (!rows.length) {
      console.warn("[snapshot] Baserow returned 0 rows — keeping existing snapshot.");
      return;
    }
    // Hide Inactive plans (Baserow Status column) — mirrors lib/baserow.js.
    const plans = rows.map(normalize).filter((p) => !/^\s*inactive\s*$/i.test(p.status));
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(plans)), { level: 9 });
    fs.writeFileSync(OUT, gz);
    console.log(`[snapshot] wrote ${plans.length} plans → lib/plans-snapshot.json.gz (${Math.round(gz.length / 1024)} KB)`);
  } catch (e) {
    console.warn(`[snapshot] fetch failed — keeping existing snapshot: ${e.message}`);
  }
}

main();
