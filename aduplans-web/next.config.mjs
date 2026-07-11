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
  // Ensure the build-time catalog snapshot (read via fs in lib/baserow.js) is
  // bundled into the serverless functions that need it.
  outputFileTracingIncludes: {
    "/": ["./lib/plans-snapshot.json.gz"],
    "/plans": ["./lib/plans-snapshot.json.gz"],
    "/plans/[id]": ["./lib/plans-snapshot.json.gz"],
  },
};

export default nextConfig;
