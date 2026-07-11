import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 30; // give slow S3 room (capped to plan limit on Vercel)

// Only proxy Baserow's own storage hosts — never an arbitrary URL.
const ALLOWED = /(\.s3\.amazonaws\.com|\.s3\.[a-z0-9-]+\.amazonaws\.com|(^|\.)baserow\.io)$/i;

// Baserow's S3 bucket resets connections / times out intermittently, so retry.
async function fetchWithRetry(url, tries = 2, timeoutMs = 8000) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timer);
      if (res.ok) return res;
      lastErr = new Error(`upstream ${res.status}`);
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  throw lastErr || new Error("fetch failed");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const w = parseInt(searchParams.get("w") || "", 10);
  if (!url) return new Response("missing url", { status: 400 });

  let target;
  try {
    target = new URL(url);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED.test(target.hostname)) {
    return new Response("forbidden host", { status: 403 });
  }

  let res;
  try {
    res = await fetchWithRetry(target.toString());
  } catch {
    return new Response("upstream unavailable", { status: 502 });
  }

  let body = Buffer.from(await res.arrayBuffer());
  let contentType = res.headers.get("content-type") || "image/jpeg";

  // Resize + recompress when a width is requested — turns a 300 KB+ S3 image
  // into a ~20-50 KB WebP, which is the single biggest load-time win.
  if (Number.isFinite(w) && w >= 16 && w <= 2400) {
    try {
      body = await sharp(body)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 76 })
        .toBuffer();
      contentType = "image/webp";
    } catch {
      /* undecodable/animated — fall back to the original bytes */
    }
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      // Hit S3 once, ever — cache for a year at the Vercel edge and the browser.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
