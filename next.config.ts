import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/place/photo/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prisma 바이너리 파일을 번들에 포함
      const {
        PrismaPlugin,
      } = require('@prisma/nextjs-monorepo-workaround-plugin');
      config.plugins = [...(config.plugins || []), new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
