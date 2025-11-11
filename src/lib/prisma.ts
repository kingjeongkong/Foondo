// Prisma 클라이언트 설정
import { PrismaClient } from '@prisma/client';

// 전역 Prisma 클라이언트 인스턴스 (개발 환경에서만)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 클라이언트 생성 (싱글톤 패턴)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '&prepared_statements=false',
      },
    },
    // Prepared Statement 비활성화
    log: ['error'],
  });

// 개발 환경에서만 전역 변수에 저장
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
