/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Baserow stores plan images on its S3 bucket (public, CORS-enabled).
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.baserow.io" },
      { protocol: "https", hostname: "baserow.io" },
    ],
  },
  // Contact lives on FrameUpNow, not here. /contact stays as a redirect so old
  // links and bookmarks still land somewhere useful. Temporary (307) on
  // purpose — a permanent 308 is cached by browsers indefinitely and is
  // painful to undo if this ever moves back on-site.
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "https://www.frameupnow.com/contact-us",
        permanent: false,
      },
    ];
  },

  // Ensure the build-time catalog snapshot (read via fs in lib/baserow.js) is
  // bundled into the serverless functions that need it.
  outputFileTracingIncludes: {
    "/": ["./lib/plans-snapshot.json.gz"],
    "/plans": ["./lib/plans-snapshot.json.gz"],
    "/plans/[id]": ["./lib/plans-snapshot.json.gz"],
  },
};

export default nextConfig;
