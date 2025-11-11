import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // 모든 API 라우트에 대해
    '/api/**': [
      // schema.prisma에 설정된 'output' 경로 내의
      // 모든 쿼리 엔진 파일을 강제로 포함시킵니다.
      './src/generated/prisma/**',
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
