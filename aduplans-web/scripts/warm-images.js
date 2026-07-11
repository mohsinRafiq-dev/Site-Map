// Post-deploy image pre-warmer.
//
// Baserow's S3 is slow on the FIRST fetch of each image (a few seconds). Our
// /api/img proxy caches every image for a year at the Vercel edge, but the very
// first visitor to each image still pays that cold cost. This script pays it
// FOR them right after a deploy: it walks the catalog snapshot and hits the
// proxy once per image so the edge cache is already warm when real users arrive.
//
// Usage:
//   node scripts/warm-images.js https://your-domain.com          (warm all)
//   node scripts/warm-images.js https://your-domain.com 300      (first 300 plans)
//   npm run warm -- https://your-domain.com

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function loadSnapshot() {
  const p = path.join(__dirname, "..", "lib", "plans-snapshot.json.gz");
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8"));
}

const proxyUrl = (base, url, w) => `${base}/api/img?url=${encodeURIComponent(url)}&w=${w}`;

async function warmOne(u) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const res = await fetch(u, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  const base = (process.argv[2] || "").replace(/\/+$/, "");
  const limit = parseInt(process.argv[3] || "0", 10);
  if (!base) {
    console.error("usage: node scripts/warm-images.js <baseUrl> [limit]");
    process.exit(1);
  }

  let plans;
  try {
    plans = loadSnapshot();
  } catch (e) {
    console.error("could not read lib/plans-snapshot.json.gz — run `npm run snapshot` first:", e.message);
    process.exit(1);
  }
  if (limit > 0) plans = plans.slice(0, limit);

  // The exact URL+width combos the UI requests: card grids (640) + detail
  // elevation/floor-plan (1200). Deduped.
  const seen = new Set();
  const jobs = [];
  for (const p of plans) {
    for (const [url, w] of [
      [p.cardImage, 640],
      [p.elevationImage, 1200],
      [p.floorPlanImage, 1200],
    ]) {
      if (url && /^https?:/i.test(url)) {
        const key = `${url}@${w}`;
        if (!seen.has(key)) {
          seen.add(key);
          jobs.push(proxyUrl(base, url, w));
        }
      }
    }
  }

  console.log(`Warming ${jobs.length} images (${plans.length} plans) via ${base}/api/img ...`);
  const CONC = 10;
  let ok = 0;
  let fail = 0;
  let done = 0;
  for (let i = 0; i < jobs.length; i += CONC) {
    const results = await Promise.all(jobs.slice(i, i + CONC).map(warmOne));
    for (const r of results) {
      r ? ok++ : fail++;
      done++;
    }
    process.stdout.write(`\r  ${done}/${jobs.length}  ok=${ok} fail=${fail}   `);
  }
  console.log(`\nDone: ${ok} warmed, ${fail} failed.`);
}

run();
