/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone', // Recommended for Docker/Cloud Run deployments
};

module.exports = nextConfig;
