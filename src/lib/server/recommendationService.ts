import type { Restaurant, RestaurantReport } from '@prisma/client';
import type { ReportProcessResult } from '@/lib/server/restaurantService';

/**
 * `getExistingRestaurantsByFood`의 반환 타입.
 * Prisma include 결과로 report는 nullable이지만, 실제론 where 필터로
 * 항상 non-null이 보장됨.
 */
type ExistingRestaurant = Restaurant & {
  report: RestaurantReport | null;
};

type RestaurantWithReport = Restaurant & { report: RestaurantReport };

export interface TtlClassification {
  /** 갱신 대상으로 선정된 stale 식당 (가장 오래된 N개) */
  selectedStale: RestaurantWithReport[];
  /** 갱신 시 caller가 기존 리포트를 lookup하기 위한 맵 (existing 전체 대상) */
  existingReportById: Map<string, RestaurantReport>;
  /** TTL 초과 stale 식당 총 개수 (로그용) */
  totalStaleCount: number;
  /** 가장 오래된 stale의 lastUpdated. stale이 없으면 null. */
  oldestStaleAt: Date | null;
}

/**
 * existingRestaurants를 TTL 기준으로 분류하고 가장 오래된 N개 stale을 선정합니다.
 *
 * @param existing `getExistingRestaurantsByFood` 결과 (report nullable)
 * @param options.ttlDays 이 기간 이상 지난 리포트를 stale로 간주
 * @param options.refreshLimit 한 번에 갱신할 stale 최대 개수
 * @param options.now 현재 시각 (테스트 주입용, 기본값은 new Date())
 */
export function classifyExistingByTtl(
  existing: ExistingRestaurant[],
  options: { ttlDays: number; refreshLimit: number; now?: Date }
): TtlClassification {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - options.ttlDays * 86_400_000);

  const withReport: RestaurantWithReport[] = existing.flatMap((r) =>
    r.report ? [{ ...r, report: r.report }] : []
  );

  const staleSorted = withReport
    .filter((r) => r.report.lastUpdated < cutoff)
    .sort(
      (a, b) =>
        a.report.lastUpdated.getTime() - b.report.lastUpdated.getTime()
    );

  return {
    selectedStale: staleSorted.slice(0, options.refreshLimit),
    existingReportById: new Map(withReport.map((r) => [r.id, r.report])),
    totalStaleCount: staleSorted.length,
    oldestStaleAt:
      staleSorted.length > 0 ? staleSorted[0].report.lastUpdated : null,
  };
}

export interface ProcessResultsSummary {
  /** created 또는 updated된 새 리포트 (Stage 4 병합용) */
  refreshedReports: RestaurantReport[];
  /** NOT_FOUND/INVALID_REQUEST로 식당 row가 삭제된 ID 집합 */
  deletedIds: Set<string>;
  /** 처리 결과 종류별 카운트 (로그용) */
  kindCounts: Record<ReportProcessResult['kind'], number>;
  /** Promise rejected 개수 (로그용) */
  rejectedCount: number;
}

/**
 * `analyzeAndSaveRestaurantReport`의 settled 결과 배열을 후처리하여
 * Stage 4 병합에 필요한 형태와 운영 로그용 카운트를 함께 만듭니다.
 */
export function summarizeProcessResults(
  results: PromiseSettledResult<ReportProcessResult>[]
): ProcessResultsSummary {
  const fulfilled = results.flatMap((r) =>
    r.status === 'fulfilled' ? [r.value] : []
  );
  const rejectedCount = results.length - fulfilled.length;

  const refreshedReports = fulfilled.flatMap((r) =>
    r.kind === 'created' || r.kind === 'updated' ? [r.report] : []
  );

  const deletedIds = new Set(
    fulfilled.flatMap((r) => (r.kind === 'deleted' ? [r.restaurantId] : []))
  );

  const kindCounts: Record<ReportProcessResult['kind'], number> = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    deleted: 0,
  };
  for (const r of fulfilled) {
    kindCounts[r.kind]++;
  }

  return { refreshedReports, deletedIds, kindCounts, rejectedCount };
}

/**
 * Stage 4 병합: deletedIds로 죽은 식당 제거 + 기존/갱신 reports를 합쳐서
 * `calculateRestaurantScores` 입력 형태로 만듭니다.
 *
 * reports 배열 순서: `[...existing, ...refreshed]` — `calculateRestaurantScores`
 * 내부 Map dedup으로 갱신된 것이 자동으로 덮어씀.
 */
export function mergeRecommendationResults(input: {
  existingRestaurants: ExistingRestaurant[];
  newRestaurants: Restaurant[];
  refreshedReports: RestaurantReport[];
  deletedIds: Set<string>;
}): { allRestaurants: Restaurant[]; allReports: RestaurantReport[] } {
  const aliveExisting = input.existingRestaurants.filter(
    (r) => !input.deletedIds.has(r.id)
  );
  const aliveNew = input.newRestaurants.filter(
    (r) => !input.deletedIds.has(r.id)
  );

  const aliveExistingReports = aliveExisting.flatMap((r) =>
    r.report ? [r.report] : []
  );

  return {
    allRestaurants: [...aliveExisting, ...aliveNew],
    allReports: [...aliveExistingReports, ...input.refreshedReports],
  };
}
