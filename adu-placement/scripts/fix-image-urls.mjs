#!/usr/bin/env node
/**
 * fix-image-urls.mjs
 *
 * Updates every Firestore plan doc to use the Firebase Storage download URL
 * format (firebasestorage.googleapis.com) instead of the raw GCS URL
 * (storage.googleapis.com). The Firebase format sends CORS headers
 * automatically, so Mapbox GL JS can load the images without extra config.
 *
 * Usage: npm run fix-urls
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../.env") });

const SA_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const BUCKET  = process.env.FIREBASE_STORAGE_BUCKET;

if (!SA_PATH || !BUCKET) {
  console.error("\n❌  Set FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_STORAGE_BUCKET in .env\n");
  process.exit(1);
}
if (!existsSync(SA_PATH)) {
  console.error(`\n❌  Service account file not found: ${SA_PATH}\n`);
  process.exit(1);
}

const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore }        = await import("firebase-admin/firestore");
const { getStorage }          = await import("firebase-admin/storage");

initializeApp({
  credential: cert(JSON.parse(readFileSync(SA_PATH, "utf8"))),
  storageBucket: BUCKET,
});

const db     = getFirestore();
const bucket = getStorage().bucket();

// Build the correct Firebase Storage download URL that supports CORS
function makeFirebaseUrl(storagePath) {
  const encoded = storagePath.split("/").map(encodeURIComponent).join("%2F");
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media`;
}

console.log("\n🔧  Fetching all plan docs from Firestore…");
const snap = await db.collection("plans").get();
console.log(`   Found ${snap.docs.length} plans.\n`);

let updated = 0;
let skipped = 0;
let failed  = 0;
const BATCH_SIZE = 400;

// Process in batches
for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = snap.docs.slice(i, i + BATCH_SIZE);

  for (const doc of chunk) {
    const data = doc.data();

    // Try to find the storage path from the existing imageUrl or build it from the doc id
    let storagePath = null;

    if (data.imageUrl) {
      // Extract path from old URL: https://storage.googleapis.com/BUCKET/plans/...
      const match = data.imageUrl.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
      if (match) storagePath = decodeURIComponent(match[1]);
    }

    if (!storagePath) {
      // Build storage path from series + image file listing
      const jSlug = (data.series || "").toLowerCase().replace(/\s+/g, "-");
      // We need to find the actual file in storage
      const [files] = await bucket.getFiles({ prefix: `plans/${jSlug}/` });
      const docSlug = doc.id; // e.g. "hawthorne-1423"
      const planId  = docSlug.replace(`${jSlug}-`, "");
      const match   = files.find((f) => f.name.includes(`/${planId}_`) || f.name.includes(`/${planId}-`));
      if (match) storagePath = match.name;
    }

    if (!storagePath) {
      console.warn(`  ⚠  Could not determine storage path for: ${doc.id}`);
      skipped++;
      continue;
    }

    const newUrl = makeFirebaseUrl(storagePath);

    // Skip if already in Firebase format
    if (data.imageUrl === newUrl) {
      skipped++;
      continue;
    }

    try {
      // Also make the file public just in case
      await bucket.file(storagePath).makePublic().catch(() => {});
      batch.update(doc.ref, { imageUrl: newUrl, image: newUrl });
      updated++;
      console.log(`  ✓  ${doc.id}`);
    } catch (err) {
      console.error(`  ✗  ${doc.id}: ${err.message}`);
      failed++;
    }
  }

  await batch.commit();
}

console.log(`
╔══════════════════════════════════════════════════╗
║               URL Fix Complete                   ║
╚══════════════════════════════════════════════════╝
  ✅  Updated : ${updated}
  ⏭  Skipped : ${skipped}
  ❌  Failed  : ${failed}

  Hard-refresh the app (Ctrl+Shift+R) — floor plans
  should now appear on the map.
`);
process.exit(failed > 0 ? 1 : 0);
