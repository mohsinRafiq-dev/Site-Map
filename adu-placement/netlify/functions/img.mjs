// Netlify function — GET /api/img?url=<image>. Image proxy: serves a
// cross-origin image (e.g. Baserow S3, which doesn't send CORS headers on GET)
// through our own origin with CORS enabled, so it can be used as a Mapbox
// WebGL texture for the floor-plan overlay. Same behaviour as api/img.js.
export default async (req) => {
  const target = new URL(req.url).searchParams.get("url");
  if (!target || !/^https?:\/\//.test(target)) {
    return new Response("missing or invalid url", { status: 400 });
  }
  try {
    const upstream = await fetch(target);
    if (!upstream.ok) return new Response("upstream error", { status: upstream.status });
    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/png",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("proxy error", { status: 502 });
  }
};

export const config = { path: "/api/img" };
