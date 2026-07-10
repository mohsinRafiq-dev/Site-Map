// Image proxy — serves a cross-origin image (e.g. Baserow S3, which doesn't
// send CORS headers on GET) through our own origin with CORS enabled, so it
// can be used as a Mapbox WebGL texture for the floor-plan overlay.
export default async function handler(req, res) {
  const target = req.query.url;
  if (!target || !/^https?:\/\//.test(target)) {
    return res.status(400).send("missing or invalid url");
  }
  try {
    const upstream = await fetch(target);
    if (!upstream.ok) return res.status(upstream.status).send("upstream error");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/png");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buf);
  } catch {
    return res.status(502).send("proxy error");
  }
}
