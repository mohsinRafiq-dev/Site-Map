#!/usr/bin/env node
/**
 * clear-plans.mjs
 * Deletes ALL plans from Firestore + Firebase Storage.
 * Run once to start fresh, then re-run migrate to re-upload.
 *
 * Usage: npm run clear-plans
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

// ── 1. Delete all Firestore /plans docs ──────────────────────────────────────
console.log("\n🗑  Deleting Firestore /plans collection…");
const snap = await db.collection("plans").get();
const BATCH_SIZE = 400; // Firestore max batch = 500
let deleted = 0;

for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
  const batch = db.batch();
  snap.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
  await batch.commit();
  deleted += Math.min(BATCH_SIZE, snap.docs.length - i);
  console.log(`   deleted ${deleted} / ${snap.docs.length} docs…`);
}
console.log(`   ✓ ${deleted} Firestore docs deleted`);

// ── 2. Delete all Storage files under plans/ ─────────────────────────────────
console.log("\n🗑  Deleting Storage files under plans/…");
const [files] = await bucket.getFiles({ prefix: "plans/" });
let storageDeleted = 0;

for (const file of files) {
  await file.delete();
  storageDeleted++;
  if (storageDeleted % 50 === 0) console.log(`   deleted ${storageDeleted} / ${files.length} files…`);
}
console.log(`   ✓ ${storageDeleted} Storage files deleted`);

console.log("\n✅  All done — Firestore and Storage are clean.\n");
process.exit(0);
