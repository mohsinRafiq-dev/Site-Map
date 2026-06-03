#!/usr/bin/env node
/**
 * set-cors.mjs
 *
 * Configures Firebase Storage to allow Mapbox GL JS to load floor plan
 * images directly. Without this, Mapbox can't fetch images from Storage
 * (it gets blocked by CORS), so the floor plan overlay on the map is empty.
 *
 * Run ONCE — the setting persists forever on the bucket.
 *
 * Usage:
 *   npm run set-cors
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
const { getStorage }          = await import("firebase-admin/storage");

initializeApp({
  credential: cert(JSON.parse(readFileSync(SA_PATH, "utf8"))),
  storageBucket: BUCKET,
});

const bucket = getStorage().bucket();

console.log(`\n🔧  Setting CORS on bucket: ${BUCKET} …`);

await bucket.setCorsConfiguration([
  {
    origin:         ["*"],
    method:         ["GET", "HEAD"],
    responseHeader: ["Content-Type", "Content-Length", "Accept-Ranges"],
    maxAgeSeconds:  3600,
  },
]);

console.log(`✅  CORS configured. Mapbox can now load floor plan images from Storage.`);
console.log(`    Hard-refresh the app (Ctrl+Shift+R) to see the floor plans on the map.\n`);
process.exit(0);
