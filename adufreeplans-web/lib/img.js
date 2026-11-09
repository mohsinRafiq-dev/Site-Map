// Route remote (Baserow S3) images through our OWN same-origin proxy so the
// browser never fetches the slow, flaky S3 bucket directly. The proxy fetches
// each image once (with retry), resizes it, and caches it for a year at the
// Vercel edge — so visitors load images from Vercel's CDN (close to them, fast)
// instead of resetting connections to S3 halfway across the world.
export function proxyImg(url, w) {
  if (!url || typeof url !== "string") return url;
  if (!/^https?:\/\//i.test(url)) return url; // local /public asset — leave as-is
  if (url.includes("/api/img")) return url; // already proxied
  const width = Number.isFinite(w) ? `&w=${w}` : "";
  return `/api/img?url=${encodeURIComponent(url)}${width}`;
}
