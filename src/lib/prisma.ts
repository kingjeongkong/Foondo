// Prisma 클라이언트 설정
import { PrismaClient } from '@/generated/prisma/client';

// 전역 Prisma 클라이언트 인스턴스 (개발 환경에서만)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL 확인 및 URL 구성
const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL environment variable is not set');
    console.error('❌ Prisma initialization error:', error.message);
    throw error;
  }

  // URL에 이미 쿼리 파라미터가 있는지 확인
  const hasQueryParams = databaseUrl.includes('?');
  const separator = hasQueryParams ? '&' : '?';

  return `${databaseUrl}${separator}prepared_statements=false`;
};

// Prisma 클라이언트 생성 (싱글톤 패턴)
// lazy initialization을 위해 함수로 래핑하지 않고 직접 생성
// Vercel에서는 모듈 로드 시점에 초기화되어야 함
let prismaInstance: PrismaClient | undefined = globalForPrisma.prisma;

if (!prismaInstance) {
  try {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: getDatabaseUrl(),
        },
      },
      // Prepared Statement 비활성화
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    // 개발 환경에서만 전역 변수에 저장
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }

    console.log('✅ Prisma Client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Prisma Client:', error);
    throw error;
  }
}

export const prisma = prismaInstance;
export default prisma;
