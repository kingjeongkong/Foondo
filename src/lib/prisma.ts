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
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // URL에 이미 쿼리 파라미터가 있는지 확인
  const hasQueryParams = databaseUrl.includes('?');
  const separator = hasQueryParams ? '&' : '?';

  return `${databaseUrl}${separator}prepared_statements=false`;
};

// Prisma 클라이언트 생성 함수 (lazy initialization)
// 빌드 시점에는 초기화하지 않고, 런타임에 실제 사용 시점에만 초기화
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    // Prepared Statement 비활성화
    log: ['error'],
  });
};

// Prisma 클라이언트 getter (lazy initialization)
const getPrismaClient = (): PrismaClient => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const prisma = createPrismaClient();

  // 개발 환경에서만 전역 변수에 저장
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
};

// Prisma 클라이언트 export (getter를 통해 lazy initialization)
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (
      client as unknown as Record<string | number | symbol, unknown>
    )[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as PrismaClient;

export default prisma;
