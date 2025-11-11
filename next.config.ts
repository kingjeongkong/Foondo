import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // 모든 경로에 Prisma 파일 포함 (API 라우트뿐만 아니라)
    '/': [
      // Prisma Query Engine 바이너리 파일들을 명시적으로 포함
      'src/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node',
      'src/generated/prisma/libquery_engine-rhel-openssl-1.1.x.so.node',
      'src/generated/prisma/libquery_engine-rhel-openssl-1.0.x.so.node',
      // 모든 Prisma 생성 파일 포함
      'src/generated/prisma/**',
    ],
    // API 라우트에도 명시적으로 포함
    '/api/**': [
      'src/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node',
      'src/generated/prisma/libquery_engine-rhel-openssl-1.1.x.so.node',
      'src/generated/prisma/libquery_engine-rhel-openssl-1.0.x.so.node',
      'src/generated/prisma/**',
    ],
  },
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
};

export default nextConfig;
