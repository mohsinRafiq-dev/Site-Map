#!/usr/bin/env node
/**
 * migrate-plans.mjs
 *
 * Bulk-uploads floor plan PNGs to Firebase Storage and writes Firestore docs.
 * Run this every time the designer delivers a new batch of plans.
 *
 * Usage:
 *   npm run migrate
 *
 * The script is fully IDEMPOTENT — plans already in Firestore are skipped,
 * so it is safe to run as many times as you want. Only NEW files get uploaded.
 *
 * Folder structure expected (set PLANS_DIR in .env):
 *
 *   Floor Plans/
 *   ├── Los Angeles/
 *   │   ├── 001_24x30.png
 *   │   ├── 002_28x32.png
 *   ├── San Diego/
 *   │   ├── 001_20x24.png
 *   └── ...
 *
 * When the designer delivers Week 2, Week 3, etc.:
 *   1. Copy/move the new PNGs into the matching Jurisdiction subfolder
 *   2. Run: npm run migrate
 *   3. Done — new plans appear on the site immediately, no rebuild needed.
 *
 * Prerequisites:
 *   • FIREBASE_SERVICE_ACCOUNT_PATH in .env → path to serviceAccountKey.json
 *   • FIREBASE_STORAGE_BUCKET in .env       → e.g. your-project.firebasestorage.app
 *   • PLANS_DIR in .env                     → path to the master Floor Plans folder
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dir = dirname(fileURLToPath(import.meta.url));
// Load .env from the adu-placement folder (one level up from /scripts)
config({ path: resolve(__dir, "../.env") });

// ── Validate required env vars ───────────────────────────────────────────────
const SA_PATH   = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const BUCKET    = process.env.FIREBASE_STORAGE_BUCKET;
const PLANS_DIR = process.env.PLANS_DIR
  ? resolve(__dir, "../..", process.env.PLANS_DIR)   // relative to project root
  : resolve(__dir, "../../Floor Plans");              // default: "Floor Plans/" next to adu-placement/

const missing = [];
if (!SA_PATH)  missing.push("FIREBASE_SERVICE_ACCOUNT_PATH");
if (!BUCKET)   missing.push("FIREBASE_STORAGE_BUCKET");
if (missing.length) {
  console.error(`\n❌  Missing .env values: ${missing.join(", ")}\n`);
  process.exit(1);
}
if (!existsSync(SA_PATH)) {
  console.error(`\n❌  Service account file not found: ${SA_PATH}\n`);
  process.exit(1);
}
if (!existsSync(PLANS_DIR)) {
  console.error(`
❌  Plans folder not found: ${PLANS_DIR}

Create the folder and add your plan PNGs using this structure:
  Floor Plans/<Jurisdiction>/<id>_<W>x<D>.png

Then re-run: npm run migrate
`);
  process.exit(1);
}

// ── Firebase Admin ───────────────────────────────────────────────────────────
const { initializeApp, cert }  = await import("firebase-admin/app");
const { getFirestore }         = await import("firebase-admin/firestore");
const { getStorage }           = await import("firebase-admin/storage");

const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));
initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET });

const db     = getFirestore();
const bucket = getStorage().bucket();

// ── Helpers ──────────────────────────────────────────────────────────────────

// "001_24x30.png" → { planId: "001", width: 24, depth: 30 }
function parseFilename(filename) {
  const m = filename.match(/^(\w[\w-]*)_([\d.]+)x([\d.]+)\.png$/i);
  if (!m) return null;
  return { planId: m[1], width: parseFloat(m[2]), depth: parseFloat(m[3]) };
}

async function uploadAndGetUrl(localPath, storagePath) {
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  await bucket.file(storagePath).makePublic();
  return `https://storage.googleapis.com/${BUCKET}/${storagePath}`;
}

// ── Discover all jurisdiction folders ────────────────────────────────────────
const jurisdictions = readdirSync(PLANS_DIR).filter((name) => {
  const full = join(PLANS_DIR, name);
  return statSync(full).isDirectory() && !name.startsWith(".");
});

if (jurisdictions.length === 0) {
  console.error(`\n❌  No jurisdiction subfolders found inside:\n    ${PLANS_DIR}\n`);
  process.exit(1);
}

// ── Count total PNGs first so we can show a progress bar ─────────────────────
let totalFiles = 0;
for (const j of jurisdictions) {
  const files = readdirSync(join(PLANS_DIR, j)).filter(
    (f) => extname(f).toLowerCase() === ".png"
  );
  totalFiles += files.length;
}

console.log(`
╔══════════════════════════════════════════════════╗
║            FrameUpNow Plan Migration             ║
╚══════════════════════════════════════════════════╝
  Plans folder : ${PLANS_DIR}
  Jurisdictions: ${jurisdictions.length}
  Total PNGs   : ${totalFiles}
  Bucket       : ${BUCKET}
`);

// ── Main upload loop ──────────────────────────────────────────────────────────
let uploaded = 0;
let skipped  = 0;
let failed   = 0;
let processed = 0;

for (const jurisdiction of jurisdictions) {
  const jDir  = join(PLANS_DIR, jurisdiction);
  const files = readdirSync(jDir).filter(
    (f) => extname(f).toLowerCase() === ".png"
  );

  if (files.length === 0) continue;
  console.log(`\n📂  ${jurisdiction} (${files.length} plans)`);

  for (const filename of files) {
    processed++;
    const progress = `[${processed}/${totalFiles}]`;

    const meta = parseFilename(filename);
    if (!meta) {
      console.warn(`  ${progress} ⚠  Skipping — filename not in format <id>_<W>x<D>.png: ${filename}`);
      skipped++;
      continue;
    }

    const { planId, width, depth } = meta;
    const slug    = jurisdiction.toLowerCase().replace(/\s+/g, "-");
    const docId   = `${slug}-${planId}`;
    const sqft    = Math.round(width * depth);
    const srcPath = join(jDir, filename);
    const dstPath = `plans/${slug}/${filename}`;

    // Idempotency: skip if the Firestore doc already exists
    const existing = await db.collection("plans").doc(docId).get();
    if (existing.exists) {
      process.stdout.write(`  ${progress} ✓  Already uploaded: ${docId}\n`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  ${progress} ↑  Uploading ${docId} … `);
      const imageUrl = await uploadAndGetUrl(srcPath, dstPath);

      await db.collection("plans").doc(docId).set({
        id:       docId,
        series:   jurisdiction,
        name:     `Plan ${planId}`,
        tagline:  `${width}' × ${depth}' · ${sqft.toLocaleString()} sq ft · ${jurisdiction}`,
        width,
        depth,
        sqft,
        imageUrl,
        keySpecs: {
          livableSqft: sqft,
          bedrooms:    "See plan",
          bathrooms:   "See plan",
          floors:      1,
          garage:      0,
          studs:       "See plan",
        },
        sortOrder: isNaN(parseInt(planId, 10)) ? 9999 : parseInt(planId, 10),
        features:  [],
        layout:    { rooms: [], decks: [], doors: [] },
        createdAt: new Date(),
      });

      uploaded++;
      console.log("✓ done");
    } catch (err) {
      failed++;
      console.error(`✗ FAILED\n      ${err.message}`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════╗
║                   Migration Done                 ║
╚══════════════════════════════════════════════════╝
  ✅  Uploaded : ${uploaded} new plans
  ⏭  Skipped  : ${skipped}  (already in Firestore or bad filename)
  ❌  Failed   : ${failed}

  ${uploaded > 0 ? "New plans are LIVE on the site immediately — no rebuild needed." : "No new plans were added this run."}
`);
process.exit(failed > 0 ? 1 : 0);
