#!/usr/bin/env node
/**
 * migrate-plans.mjs
 *
 * Uploads floor plan PNGs to Firebase Storage + writes Firestore docs.
 * Handles TWO filename formats automatically:
 *
 *  Format A (rich — preferred):
 *    <Jurisdiction>/<City>-<sqft>-<N Bed N Bath | Studio>-<StyleName>.png
 *    e.g. Canyon Lake/Canyon Lake-1198-3 Bed 2 Bath-Craftsman.png
 *
 *  Format B (dimensions — fallback):
 *    <Jurisdiction>/<id>_<W>x<D>.png
 *    e.g. General/1055_17x35.png
 *
 * Usage:
 *   npm run migrate
 *
 * Fully IDEMPOTENT — already-uploaded plans are skipped every time.
 * New plans dropped into any jurisdiction subfolder are picked up on the next run.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../.env") });

// ── Env validation ────────────────────────────────────────────────────────────
const SA_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const BUCKET  = process.env.FIREBASE_STORAGE_BUCKET;

const APP_ROOT    = resolve(__dir, "..");          // adu-placement/
const PROJECT_ROOT = resolve(__dir, "../..");       // Site Map/

// PLANS_DIRS: comma-separated paths (relative to adu-placement/).
// Defaults to scanning adu-placement/Floor Plans/ automatically.
const PLANS_DIRS_RAW = process.env.PLANS_DIRS || process.env.PLANS_DIR;

const plansDirs = PLANS_DIRS_RAW
  ? PLANS_DIRS_RAW.split(",").map((p) => resolve(APP_ROOT, p.trim()))
  : [resolve(APP_ROOT, "Floor Plans")].filter(existsSync);

if (!SA_PATH || !BUCKET) {
  console.error("\n❌  Missing .env: FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_STORAGE_BUCKET are required.\n");
  process.exit(1);
}
if (!existsSync(SA_PATH)) {
  console.error(`\n❌  Service account not found: ${SA_PATH}\n`);
  process.exit(1);
}
if (plansDirs.length === 0) {
  console.error("\n❌  No plan folders found. Check your folder names next to Site Map/.\n");
  process.exit(1);
}

// ── Firebase Admin ────────────────────────────────────────────────────────────
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore }        = await import("firebase-admin/firestore");
const { getStorage }          = await import("firebase-admin/storage");

initializeApp({ credential: cert(JSON.parse(readFileSync(SA_PATH, "utf8"))), storageBucket: BUCKET });
const db     = getFirestore();
const bucket = getStorage().bucket();

// ── Filename parsers ──────────────────────────────────────────────────────────

/**
 * Format A: "Canyon Lake-1198-3 Bed 2 Bath-Craftsman.png"
 *           "Paramount-447-Studio-ADU Studio.png"
 * Returns { sqft, bedrooms, bathrooms, styleName } or null
 */
function parseFormatA(filename) {
  // Match: <anything>-<sqft>-<Studio | N Bed N Bath>-<styleName>.png
  const m = filename.match(
    /^(.+)-(\d+)-(Studio|(\d+) Bed (\d+) Bath)-(.+)\.png$/i
  );
  if (!m) return null;
  const isStudio = m[3].toLowerCase() === "studio";
  return {
    sqft:      parseInt(m[2], 10),
    bedrooms:  isStudio ? 0 : parseInt(m[4], 10),
    bathrooms: isStudio ? 1 : parseInt(m[5], 10),
    bedsLabel: isStudio ? "Studio" : m[3],
    styleName: m[6].trim(),
  };
}

/**
 * Format B: "1055_17x35.png"
 * Returns { planId, width, depth } or null
 */
function parseFormatB(filename) {
  const m = filename.match(/^(\w[\w-]*)_([\d.]+)x([\d.]+)\.png$/i);
  if (!m) return null;
  return { planId: m[1], width: parseFloat(m[2]), depth: parseFloat(m[3]) };
}

/**
 * Estimate footprint dimensions from sqft.
 * Uses a 1:1.3 aspect ratio typical of ADUs.
 * Width is the shorter side (E-W), depth is the longer (N-S).
 */
function estimateDimensions(sqft) {
  const width = Math.round(Math.sqrt(sqft / 1.3));
  const depth = Math.round(sqft / width);
  return { width, depth };
}

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadAndGetUrl(localPath, storagePath) {
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: { contentType: "image/png", cacheControl: "public, max-age=31536000, immutable" },
  });
  await bucket.file(storagePath).makePublic();
  // Use the Firebase Storage download URL format — it sends CORS headers
  // automatically, which Mapbox GL JS requires to load images as overlays.
  const encoded = storagePath.split("/").map(encodeURIComponent).join("%2F");
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media`;
}

// ── Scan all plan folders (any depth) ────────────────────────────────────────
// Recursively walks the folder tree.
// Any folder that directly contains PNGs is treated as a jurisdiction folder.
let allPlans = []; // { jurisdiction, filename, localPath }

function scanDir(dir) {
  const entries = readdirSync(dir).filter((n) => !n.startsWith("."));
  const pngs  = entries.filter((n) => extname(n).toLowerCase() === ".png");
  const dirs  = entries.filter((n) => statSync(join(dir, n)).isDirectory());

  if (pngs.length > 0) {
    // This folder contains PNGs — use the folder name as the jurisdiction
    const jurisdiction = dir.split(/[\\/]/).pop();
    for (const f of pngs) {
      allPlans.push({ jurisdiction, filename: f, localPath: join(dir, f) });
    }
  }

  // Always recurse into subdirectories to find nested jurisdiction folders
  for (const d of dirs) {
    scanDir(join(dir, d));
  }
}

for (const plansDir of plansDirs) {
  if (!existsSync(plansDir)) {
    console.warn(`⚠  Folder not found, skipping: ${plansDir}`);
    continue;
  }
  console.log(`\n📁  Scanning: ${plansDir}`);
  scanDir(plansDir);
}

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log(`║            FrameUpNow Plan Migration             ║`);
console.log(`╚══════════════════════════════════════════════════╝`);
console.log(`  Total PNGs found : ${allPlans.length}`);
console.log(`  Bucket           : ${BUCKET}\n`);

// ── Upload loop ───────────────────────────────────────────────────────────────
let uploaded = 0, skipped = 0, failed = 0;

for (let i = 0; i < allPlans.length; i++) {
  const { jurisdiction, filename, localPath } = allPlans[i];
  const progress = `[${i + 1}/${allPlans.length}]`;
  const jSlug    = slug(jurisdiction);

  // Try Format A first (rich), then Format B (dimensions)
  const fmtA = parseFormatA(filename);
  const fmtB = !fmtA ? parseFormatB(filename) : null;

  if (!fmtA && !fmtB) {
    console.warn(`  ${progress} ⚠  Unrecognised filename, skipping: ${filename}`);
    skipped++;
    continue;
  }

  let docId, width, depth, sqft, bedrooms, bathrooms, bedsLabel, name, tagline;

  if (fmtA) {
    // Rich format — extract everything from the filename
    ({ sqft, bedrooms, bathrooms, bedsLabel, styleName: name } = fmtA);
    ({ width, depth } = estimateDimensions(sqft));
    docId   = `${jSlug}-${sqft}-${slug(name)}`;
    tagline = `${bedsLabel} · ${sqft.toLocaleString()} sq ft · ${jurisdiction}`;
  } else {
    // Dimensions format — extract W×D, estimate sqft
    ({ planId: name, width, depth } = fmtB);
    sqft      = Math.round(width * depth);
    bedrooms  = null;
    bathrooms = null;
    bedsLabel = "See plan";
    docId     = `${jSlug}-${name}`;
    tagline   = `${width}' × ${depth}' · ${sqft.toLocaleString()} sq ft · ${jurisdiction}`;
  }

  // Idempotency — skip if doc already exists
  const existing = await db.collection("plans").doc(docId).get();
  if (existing.exists) {
    console.log(`  ${progress} ✓  Already exists: ${docId}`);
    skipped++;
    continue;
  }

  try {
    process.stdout.write(`  ${progress} ↑  ${docId} … `);
    const storagePath = `plans/${jSlug}/${filename}`;
    const imageUrl    = await uploadAndGetUrl(localPath, storagePath);

    await db.collection("plans").doc(docId).set({
      id:       docId,
      series:   jurisdiction,                     // jurisdiction = category in the UI
      name,
      tagline,
      width,
      depth,
      sqft,
      imageUrl,
      keySpecs: {
        livableSqft: sqft,
        bedrooms:    bedrooms ?? "See plan",
        bathrooms:   bathrooms ?? "See plan",
        floors:      1,
        garage:      0,
        studs:       "See plan",
      },
      sortOrder: sqft,                             // sort by size within each jurisdiction
      features:  [],
      layout:    { rooms: [], decks: [], doors: [] },
      createdAt: new Date(),
    });

    uploaded++;
    console.log("✓ done");
  } catch (err) {
    failed++;
    console.error(`✗ FAILED — ${err.message}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════╗
║                 Migration Done                   ║
╚══════════════════════════════════════════════════╝
  ✅  Uploaded : ${uploaded}
  ⏭  Skipped  : ${skipped}
  ❌  Failed   : ${failed}
${uploaded > 0 ? "\n  Plans are LIVE on the site — no rebuild needed." : ""}
`);
process.exit(failed > 0 ? 1 : 0);
