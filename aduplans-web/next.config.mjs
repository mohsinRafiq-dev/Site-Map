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
};

export default nextConfig;
