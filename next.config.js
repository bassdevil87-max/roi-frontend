/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Skip ESLint during production builds — we handle linting in dev
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type-checking during production builds — we check in dev
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
