import type {
  Restaurant,
  RestaurantReport,
  ReviewData,
  ScoredRestaurant,
} from '@/app/types/restaurant';
import type { PrioritySettings } from '@/app/types/search';
import {
  getMultipleRestaurantReviews,
  searchRestaurantsByFood,
} from '@/lib/googlePlaces';
import { prisma } from '@/lib/prisma';
import { analyzeReviewsWithAI } from '@/lib/server/aiReviewService';
import { withTimeout } from '@/utils/promise';
import pLimit from 'p-limit';

/**
 * Google Places API로 음식점을 검색하고 DB에 저장합니다.
 * @param cityId 도시 ID (Mapbox ID)
 * @param cityName 도시명
 * @param foodId 음식 ID
 * @param foodName 음식명
 * @returns 저장된 레스토랑 배열
 */
export async function searchAndSaveRestaurants(
  cityId: string,
  cityName: string,
  foodId: string,
  foodName: string
) {
  console.log(`🔍 음식점 검색 시작: ${cityName} - ${foodName}`);

  // 1. Google Places API로 음식점 검색
  const restaurants = await searchRestaurantsByFood(cityName, foodName);

  if (restaurants.length === 0) {
    console.log(`⚠️ 검색 결과 없음: ${cityName} - ${foodName}`);
    return [];
  }

  console.log(`✅ ${restaurants.length}개 음식점 검색 완료`);

  // 2. DB에 음식점 저장 및 음식점-음식 관계 저장
  // 각 음식점과 그 관계를 하나의 트랜잭션으로 처리하되, 일부 실패 허용
  // Supabase 무료 티어의 동시 트랜잭션 제한을 피하기 위해 순차 처리
  const transactionLimiter = pLimit(5);

  const saveTasks = restaurants.map((restaurant) =>
    transactionLimiter(async () => {
      try {
        const saved = await prisma.$transaction(
          async (tx) => {
            // photoReference는 새 값이 있을 때만 갱신 (없으면 기존 값 유지).
            // URL 조립은 저장하지 않고 브라우저 요청 시 photo proxy route에서 수행 — API key가 DB·클라이언트에 노출되지 않게 하기 위함.
            const photoReference = restaurant.photoReference ?? null;

            // 2-1. 음식점 저장 (upsert - placeId 기준으로 중복 방지)
            const saved = await tx.restaurant.upsert({
              where: { placeId: restaurant.placeId },
              update: {
                name: restaurant.name,
                address: restaurant.address,
                ...(photoReference !== null && { photoReference }),
              },
              create: {
                placeId: restaurant.placeId,
                name: restaurant.name,
                address: restaurant.address,
                photoReference,
                cityId: cityId,
              },
            });

            // 2-2. 음식점-음식 관계 저장 (음식점 저장 후, 같은 트랜잭션)
            await tx.restaurantFood.upsert({
              where: {
                restaurantId_foodId: {
                  restaurantId: saved.id,
                  foodId: foodId,
                },
              },
              update: {}, // 이미 관계가 있으면 업데이트 없음
              create: {
                restaurantId: saved.id,
                foodId: foodId,
              },
            });

            return saved;
          },
          {
            timeout: 10000, // 10초 타임아웃 설정
          }
        );

        return saved;
      } catch (error) {
        // 일부 실패 허용: 에러 로그만 남기고 계속 진행
        console.error(
          `❌ 음식점 저장 실패 (placeId: ${restaurant.placeId}):`,
          error
        );
        return null;
      }
    })
  );

  const savedRestaurants = (await Promise.all(saveTasks)).filter(
    (restaurant): restaurant is Restaurant => restaurant !== null
  );

  const successCount = savedRestaurants.length;
  const failureCount = restaurants.length - successCount;

  console.log(
    `💾 ${successCount}/${restaurants.length}개 음식점 및 관계 저장 완료${failureCount > 0 ? ` (${failureCount}개 실패)` : ''}`
  );

  return savedRestaurants;
}

/**
 * DB에서 특정 도시·음식에 연결된 기존 음식점들을 조회합니다.
 * 리포트가 있는 음식점만 반환합니다.
 * @param foodId 음식 ID
 * @param cityId 도시 ID (선택한 도시만 조회)
 * @returns 리포트가 있는 음식점 배열 (report 포함)
 */
export async function getExistingRestaurantsByFood(
  foodId: string,
  cityId: string
) {
  console.log(`🔍 기존 음식점 조회 시작: foodId=${foodId}, cityId=${cityId}`);

  const restaurants = await prisma.restaurant.findMany({
    where: {
      cityId,
      foods: {
        some: {
          foodId: foodId,
        },
      },
      report: {
        tasteScore: { not: null },
      },
    },
    include: {
      report: true,
    },
  });

  console.log(`✅ 기존 음식점 조회 완료: ${restaurants.length}개`);

  return restaurants;
}

/**
 * 여러 음식점의 리뷰를 수집합니다.
 * 이 함수는 완전한 리포트가 없는 음식점들에 대해서만 호출됩니다.
 * DB 조회 없이 바로 Google Places API로 리뷰를 수집합니다.
 * 리뷰가 없는 경우에도 빈 배열로 반환하여 기본 리포트 생성을 보장합니다.
 * @param restaurants 리뷰 수집이 필요한 음식점 배열 (완전한 리포트가 없는 것이 확실한 경우)
 * @returns 리뷰 데이터 배열 (리뷰가 없는 경우 빈 배열 포함)
 */
export async function collectRestaurantReviews(
  restaurants: Pick<Restaurant, 'id' | 'placeId'>[]
): Promise<ReviewData[]> {
  if (restaurants.length === 0) {
    return [];
  }

  console.log(`📝 단계 2 실행: ${restaurants.length}개 음식점 리뷰 수집 시작`);

  const placeIds = restaurants.map((r) => r.placeId);
  const reviewsResults = await getMultipleRestaurantReviews(placeIds);

  // 리뷰 결과 Map 생성 (빠른 조회용)
  const reviewResultMap = new Map(
    reviewsResults.map((result) => [result.placeId, result])
  );

  // 리뷰 수집 결과 처리
  const reviewDataList: ReviewData[] = [];

  restaurants.forEach((restaurant) => {
    const reviewResult = reviewResultMap.get(restaurant.placeId);

    // 결과 자체가 없으면 (이 분기는 placeIds와 results 길이 mismatch 시에만 발생) ERROR로 간주
    if (!reviewResult) {
      console.warn(
        `⚠️ 리뷰 결과 누락: ${restaurant.placeId} (ERROR로 처리)`
      );
      reviewDataList.push({
        restaurantId: restaurant.id,
        status: 'ERROR',
        reviews: [],
      });
      return;
    }

    // 리뷰 텍스트만 추출하고 빈 텍스트 제거
    const reviewTexts = reviewResult.reviews
      .map((review) => review.text)
      .filter(Boolean);

    reviewDataList.push({
      restaurantId: restaurant.id,
      status: reviewResult.status,
      reviews: reviewTexts,
    });
  });

  // 통계 로그
  const counts = reviewDataList.reduce(
    (acc, r) => {
      if (r.status === 'OK' && r.reviews.length > 0) acc.withReviews++;
      else if (r.status === 'OK') acc.okEmpty++;
      else if (r.status === 'NOT_FOUND' || r.status === 'INVALID_REQUEST')
        acc.notFound++;
      else acc.error++;
      return acc;
    },
    { withReviews: 0, okEmpty: 0, notFound: 0, error: 0 }
  );
  console.log(
    `✅ 단계 2 완료: ${reviewDataList.length}개 처리됨 (리뷰있음 ${counts.withReviews} / OK빈리뷰 ${counts.okEmpty} / 부재 ${counts.notFound} / 에러 ${counts.error})`
  );

  return reviewDataList;
}

/**
 * 분석/저장 처리 결과 종류.
 * - created/updated: 신규 생성 또는 기존 갱신, report 포함
 * - skipped: refresh 도중 일시적 에러 또는 OK+빈리뷰 → 기존 리포트 유지
 * - deleted: place 부재(NOT_FOUND/INVALID_REQUEST) → 식당 row 삭제됨 (cascade)
 * - failed: 신규 처리 중 실패 → DB 저장 없음, 결과에서 제외
 */
export type ReportProcessResult =
  | { kind: 'created' | 'updated'; report: RestaurantReport }
  | { kind: 'skipped' | 'failed' | 'deleted'; restaurantId: string };

/**
 * 음식점의 리뷰를 AI로 분석하고 리포트를 생성/업데이트합니다.
 *
 * Google Places Details 응답 status에 따라 분기:
 * - NOT_FOUND / INVALID_REQUEST: 식당 row 삭제 (cascade로 report·foods 정리)
 * - ERROR: 신규는 failed, refresh는 skipped (기존 유지)
 * - OK + 리뷰 비어있음: 신규는 default 리포트 생성, refresh는 skipped
 * - OK + 리뷰 있음: AI 분석 → 신규는 CREATE / refresh는 UPDATE
 *
 * @param reviewData 리뷰 + status
 * @param existingReport 갱신 대상이면 기존 리포트, 신규면 null
 */
export async function analyzeAndSaveRestaurantReport(
  reviewData: ReviewData,
  existingReport: RestaurantReport | null = null
): Promise<ReportProcessResult> {
  const { restaurantId, status, reviews } = reviewData;
  const isRefresh = existingReport !== null;

  // 1) place 부재 → 식당 row 삭제 (cascade)
  if (status === 'NOT_FOUND' || status === 'INVALID_REQUEST') {
    try {
      const deleteResult = await prisma.restaurant.deleteMany({
        where: { id: restaurantId },
      });
      console.log(
        `🗑️  식당 삭제 (${status}, count=${deleteResult.count}): ${restaurantId}`
      );
      return { kind: 'deleted', restaurantId };
    } catch (error) {
      console.error(
        `❌ 식당 삭제 실패 (${restaurantId}):`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { kind: 'failed', restaurantId };
    }
  }

  // 2) 일시적 에러 → refresh는 SKIP, 신규는 failed
  if (status === 'ERROR') {
    console.log(
      `⏭️  ${isRefresh ? 'refresh SKIP' : '신규 failed'} (ERROR): ${restaurantId}`
    );
    return { kind: isRefresh ? 'skipped' : 'failed', restaurantId };
  }

  // 3) status === 'OK' + 리뷰 빈 배열
  if (reviews.length === 0) {
    if (isRefresh) {
      console.log(`⏭️  refresh SKIP (OK+빈리뷰): ${restaurantId}`);
      return { kind: 'skipped', restaurantId };
    }
    // 신규 → 기본 리포트 생성 (기존 동작 유지)
    console.log(`📋 기본 리포트 생성: ${restaurantId}`);
    try {
      const report = await prisma.restaurantReport.upsert({
        where: { restaurantId },
        update: {},
        create: { restaurantId },
      });
      return { kind: 'created', report };
    } catch (error) {
      console.error(
        `❌ 기본 리포트 생성 실패 (${restaurantId}):`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { kind: 'failed', restaurantId };
    }
  }

  // 4) status === 'OK' + 리뷰 있음 → AI 분석
  try {
    console.log(
      `🤖 AI 분석 시작 (${isRefresh ? 'refresh' : '신규'}): ${restaurantId} (${reviews.length}개 리뷰)`
    );

    const analysis = await withTimeout(
      analyzeReviewsWithAI(reviews),
      15000,
      'AI analysis timeout'
    );

    const reportFields = {
      tasteScore: analysis.scores.taste,
      priceScore: analysis.scores.price,
      atmosphereScore: analysis.scores.atmosphere,
      serviceScore: analysis.scores.service,
      quantityScore: analysis.scores.quantity,
      accessibilityScore: analysis.scores.accessibility,
      aiSummary: analysis.summary,
    };

    console.log(
      `💾 리포트 ${isRefresh ? 'UPDATE' : 'CREATE'}: ${restaurantId} (신뢰도: ${analysis.confidence}%)`
    );

    const report = await prisma.restaurantReport.upsert({
      where: { restaurantId },
      update: reportFields,
      create: {
        restaurantId,
        ...reportFields,
      },
    });

    return { kind: isRefresh ? 'updated' : 'created', report };
  } catch (error) {
    console.error(
      `❌ 리포트 생성/갱신 실패 (${restaurantId}):`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    // refresh 실패 → SKIP (기존 유지). 신규 실패 → failed (결과 제외)
    return { kind: isRefresh ? 'skipped' : 'failed', restaurantId };
  }
}

/**
 * 음식점들의 리포트를 기반으로 가중치를 적용하여 최종 점수를 계산하고 랭킹을 생성합니다.
 * @param restaurants 음식점 배열
 * @param reports 리포트 배열
 * @param priorities 사용자 우선순위 설정
 * @returns 랭킹 정렬된 음식점 결과 배열
 */
export function calculateRestaurantScores(
  restaurants: Restaurant[],
  reports: RestaurantReport[],
  priorities: PrioritySettings
): ScoredRestaurant[] {
  // 1. 순위를 가중치로 변환
  const rankToWeightMap: Record<number, number> = {
    1: 2.0, // 1순위
    2: 1.5, // 2순위
    3: 1.2, // 3순위
    0: 0.8, // 미선택
  };

  const weights = {
    taste: rankToWeightMap[priorities.taste],
    price: rankToWeightMap[priorities.price],
    atmosphere: rankToWeightMap[priorities.atmosphere],
    service: rankToWeightMap[priorities.service],
    quantity: rankToWeightMap[priorities.quantity],
    accessibility: rankToWeightMap[priorities.accessibility],
  };

  const totalWeight =
    weights.taste +
    weights.price +
    weights.atmosphere +
    weights.service +
    weights.quantity +
    weights.accessibility;

  // 2. 리포트 Map 생성 (빠른 조회용)
  const reportMap = new Map(
    reports.map((report) => [report.restaurantId, report])
  );

  // 3. 음식점과 리포트를 매핑하고 최종 점수 계산
  const restaurantScores = restaurants
    .map((restaurant) => {
      const report = reportMap.get(restaurant.id);

      // 리포트가 없으면 제외
      if (!report) {
        return null;
      }

      // 점수가 모두 null이면 제외
      if (
        report.tasteScore === null &&
        report.priceScore === null &&
        report.atmosphereScore === null &&
        report.serviceScore === null &&
        report.quantityScore === null &&
        report.accessibilityScore === null
      ) {
        return null;
      }

      // 최종 점수 계산
      let finalScore: number;

      if (totalWeight === 0) {
        // 가중치가 없으면 모든 점수의 평균 사용
        const scores = [
          report.tasteScore,
          report.priceScore,
          report.atmosphereScore,
          report.serviceScore,
          report.quantityScore,
          report.accessibilityScore,
        ].filter((score): score is number => score !== null);

        finalScore =
          scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
      } else {
        // 정규화된 가중 평균
        const weightedSum =
          (report.tasteScore || 0) * weights.taste +
          (report.priceScore || 0) * weights.price +
          (report.atmosphereScore || 0) * weights.atmosphere +
          (report.serviceScore || 0) * weights.service +
          (report.quantityScore || 0) * weights.quantity +
          (report.accessibilityScore || 0) * weights.accessibility;

        finalScore = weightedSum / totalWeight;
      }

      return {
        restaurant,
        report,
        finalScore,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.finalScore - a.finalScore) // 내림차순 정렬
    .map((item, index) => ({
      ...item,
      rank: index + 1, // 랭킹 추가
    }));

  return restaurantScores;
}
