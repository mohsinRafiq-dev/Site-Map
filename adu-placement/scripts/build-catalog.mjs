#!/usr/bin/env node
/**
 * build-catalog.mjs
 *
 * Rebuilds plans/catalog.json in Firebase Storage from the current Firestore
 * `plans` collection — WITHOUT re-uploading any images. The app fetches this
 * single CDN-cached file instead of querying every plan doc, which saves a
 * Firestore read per plan, per visitor.
 *
 * `npm run migrate` already regenerates the catalog at the end. Run this
 * standalone only if you edited plan docs directly in the console and want
 * the change to show on the site.
 *
 * Usage: npm run build-catalog
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
  console.error(`\n❌  Service account not found: ${SA_PATH}\n`);
  process.exit(1);
}

const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore }        = await import("firebase-admin/firestore");
const { getStorage }          = await import("firebase-admin/storage");

initializeApp({ credential: cert(JSON.parse(readFileSync(SA_PATH, "utf8"))), storageBucket: BUCKET });
const db     = getFirestore();
const bucket = getStorage().bucket();

process.stdout.write("📦  Building catalog.json from Firestore … ");
const snap = await db.collection("plans").get();
const plans = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
plans.sort((a, b) =>
  (a.series || "").localeCompare(b.series || "") || (a.sqft || 0) - (b.sqft || 0)
);
const json = JSON.stringify({ version: Date.now(), count: plans.length, plans });
const file = bucket.file("plans/catalog.json");
await file.save(json, {
  contentType: "application/json",
  metadata: { cacheControl: "public, max-age=300" },
});
await file.makePublic();
console.log(`done (${plans.length} plans).\n`);
process.exit(0);
