/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev only: Next blocks the client JS (theme toggle, plan filters…) when the
  // dev server is opened from anything but localhost — allow 127.0.0.1 and the
  // local network (e.g. 192.168.0.110, for testing on a phone).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*"],
  images: {
    // Baserow stores plan images on its S3 bucket (public, CORS-enabled).
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.baserow.io" },
      { protocol: "https", hostname: "baserow.io" },
    ],
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
