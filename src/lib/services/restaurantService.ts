import type {
  Restaurant,
  RestaurantReport,
  ReviewCollectionResult,
  ReviewData,
  ScoredRestaurant,
} from '@/app/types/restaurant';
import type { PrioritySettings } from '@/app/types/search';
import {
  getMultipleRestaurantReviews,
  searchRestaurantsByFood,
} from '@/lib/googlePlaces';
import { prisma } from '@/lib/prisma';
import { analyzeReviewsWithAI } from '@/lib/services/aiReviewService';

/**
 * Google Places API로 음식점을 검색하고 DB에 저장합니다.
 * @param cityId 도시 ID (Mapbox ID)
 * @param cityName 도시명
 * @param foodId 음식 ID
 * @param foodName 음식명
 * @param maxResults 최대 검색 결과 수
 * @returns 저장된 레스토랑 배열
 */
export async function searchAndSaveRestaurants(
  cityId: string,
  cityName: string,
  foodId: string,
  foodName: string,
  maxResults: number = 5
) {
  console.log(`🔍 음식점 검색 시작: ${cityName} - ${foodName}`);

  // 1. Google Places API로 음식점 검색
  const restaurants = await searchRestaurantsByFood(
    cityName,
    foodName,
    maxResults
  );

  if (restaurants.length === 0) {
    console.log(`⚠️ 검색 결과 없음: ${cityName} - ${foodName}`);
    return [];
  }

  console.log(`✅ ${restaurants.length}개 음식점 검색 완료`);

  // 2. DB에 음식점 저장 및 음식점-음식 관계 저장
  // 각 음식점과 그 관계를 하나의 트랜잭션으로 처리하되, 일부 실패 허용
  const savePromises = restaurants.map(async (restaurant) => {
    try {
      return await prisma.$transaction(async (tx) => {
        // 2-1. 음식점 저장 (upsert - placeId 기준으로 중복 방지)
        const saved = await tx.restaurant.upsert({
          where: { placeId: restaurant.placeId },
          update: {}, // 추후 updated_at를 기준으로 업데이트 로직 추가
          create: {
            placeId: restaurant.placeId,
            name: restaurant.name,
            address: restaurant.address,
            photoUrl: restaurant.photoReference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${restaurant.photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
              : null,
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
      });
    } catch (error) {
      // 일부 실패 허용: 에러 로그만 남기고 null 반환
      console.error(
        `❌ 음식점 저장 실패 (placeId: ${restaurant.placeId}):`,
        error
      );
      return null;
    }
  });

  // 모든 Promise 실행 (일부 실패 허용)
  const results = await Promise.allSettled(savePromises);

  // 성공한 음식점만 필터링
  const savedRestaurants = results
    .filter((result) => result.status === 'fulfilled' && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<Restaurant>).value);

  const successCount = savedRestaurants.length;
  const failureCount = restaurants.length - successCount;

  console.log(
    `💾 ${successCount}/${restaurants.length}개 음식점 및 관계 저장 완료${failureCount > 0 ? ` (${failureCount}개 실패)` : ''}`
  );

  return savedRestaurants;
}

/**
 * 여러 음식점의 리뷰를 수집합니다.
 * - 리포트가 이미 있는 음식점은 리뷰 수집을 스킵하고 리포트 데이터를 반환합니다.
 * - 리포트가 없는 음식점만 Google Places API로 리뷰를 수집합니다.
 * @param restaurants 단계 1에서 저장된 음식점 배열 (DB 모델)
 * @returns 리포트가 있는 음식점과 없는 음식점을 분리하여 반환
 */
export async function collectRestaurantReviews(
  restaurants: Pick<Restaurant, 'id' | 'placeId'>[]
): Promise<ReviewCollectionResult> {
  if (restaurants.length === 0) {
    return { withReports: [], withoutReports: [] };
  }

  console.log(`📝 단계 2 실행: ${restaurants.length}개 음식점 리뷰 수집 시작`);

  // 1. 먼저 모든 음식점의 리포트 일괄 조회
  const restaurantIds = restaurants.map((r) => r.id);
  const existingReports = await prisma.restaurantReport.findMany({
    where: {
      restaurantId: { in: restaurantIds },
      tasteScore: { not: null }, // 점수가 있는 리포트만 (완전한 리포트)
    },
  });

  // 리포트 Map 생성 (빠른 조회용)
  const reportMap = new Map(
    existingReports.map((report) => [report.restaurantId, report])
  );

  // 2. 리포트가 있는 음식점과 없는 음식점 분리
  const restaurantsWithReports: RestaurantReport[] = [];

  const restaurantsNeedingReviews: Pick<Restaurant, 'id' | 'placeId'>[] = [];

  restaurants.forEach((restaurant) => {
    const existingReport = reportMap.get(restaurant.id);
    if (existingReport) {
      // 리포트가 있는 경우
      restaurantsWithReports.push(existingReport);
    } else {
      // 리포트가 없는 경우
      restaurantsNeedingReviews.push(restaurant);
    }
  });

  console.log(
    `📊 리포트 캐싱: ${restaurantsWithReports.length}개 이미 있음, ${restaurantsNeedingReviews.length}개 리뷰 수집 필요`
  );

  // 3. 리포트가 없는 음식점만 Google Places API 호출
  const withoutReports: ReviewData[] = [];

  if (restaurantsNeedingReviews.length > 0) {
    const placeIds = restaurantsNeedingReviews.map((r) => r.placeId);
    const reviewsResults = await getMultipleRestaurantReviews(placeIds);

    // 리뷰 결과 Map 생성 (빠른 조회용)
    const reviewResultMap = new Map(
      reviewsResults.map((result) => [result.placeId, result])
    );

    // 리뷰 수집 결과 처리
    restaurantsNeedingReviews.forEach((restaurant) => {
      const reviewResult = reviewResultMap.get(restaurant.placeId);

      // 리뷰 결과가 없거나 리뷰가 없으면 빈 배열
      if (
        !reviewResult ||
        !reviewResult.reviews ||
        reviewResult.reviews.length === 0
      ) {
        console.log(`⚠️ 리뷰 없음: ${restaurant.placeId}`);
        withoutReports.push({
          restaurantId: restaurant.id,
          reviews: [],
        });
        return;
      }

      // 리뷰 텍스트만 추출
      const reviewTexts = reviewResult.reviews
        .map((review) => review.text)
        .filter(Boolean);

      // 유효한 텍스트가 없으면 빈 배열
      if (reviewTexts.length === 0) {
        console.log(`⚠️ 유효한 리뷰 텍스트 없음: ${restaurant.placeId}`);
        withoutReports.push({
          restaurantId: restaurant.id,
          reviews: [],
        });
        return;
      }

      withoutReports.push({
        restaurantId: restaurant.id,
        reviews: reviewTexts,
      });
    });
  }

  const restaurantsWithCollectedReviews = withoutReports.filter(
    (r) => r.reviews.length > 0
  );

  console.log(
    `✅ 단계 2 완료: ${restaurantsWithReports.length}개 캐시됨, ${restaurantsWithCollectedReviews.length}/${restaurantsNeedingReviews.length}개 리뷰 수집됨`
  );

  return {
    withReports: restaurantsWithReports,
    withoutReports,
  };
}

/**
 * 음식점의 리뷰를 AI로 분석하고 리포트를 생성/업데이트합니다.
 * - 리포트가 없는 음식점 데이터만 받습니다 (이미 collectRestaurantReviews에서 필터링됨)
 * - 리뷰가 없는 경우: 기본 리포트 생성 (모든 점수 null)
 * - 리뷰가 있는 경우: AI 분석 실행
 * @param reviewData 리뷰 데이터 (리포트가 없는 음식점만)
 * @returns 생성/업데이트된 리포트
 */
export async function analyzeAndSaveRestaurantReport(
  reviewData: ReviewData
): Promise<RestaurantReport> {
  try {
    if (reviewData.reviews.length === 0) {
      // 리뷰 없음 → 기본 리포트 생성 (모든 점수 null)
      console.log(`📋 기본 리포트 생성: ${reviewData.restaurantId}`);
      return await prisma.restaurantReport.upsert({
        where: { restaurantId: reviewData.restaurantId },
        update: {},
        create: {
          restaurantId: reviewData.restaurantId,
        },
      });
    }

    // 리뷰 있음 → AI 분석 실행
    console.log(
      `🤖 AI 분석 시작: ${reviewData.restaurantId} (${reviewData.reviews.length}개 리뷰)`
    );

    const analysis = await analyzeReviewsWithAI(reviewData.reviews);

    console.log(
      `💾 리포트 저장: ${reviewData.restaurantId} (신뢰도: ${analysis.confidence}%)`
    );

    return await prisma.restaurantReport.upsert({
      where: { restaurantId: reviewData.restaurantId },
      update: {}, // 추후 updated_at를 기준으로 업데이트 로직 추가
      create: {
        restaurantId: reviewData.restaurantId,
        tasteScore: analysis.scores.taste,
        priceScore: analysis.scores.price,
        atmosphereScore: analysis.scores.atmosphere,
        serviceScore: analysis.scores.service,
        quantityScore: analysis.scores.quantity,
        accessibilityScore: analysis.scores.accessibility,
        aiSummary: analysis.summary,
      },
    });
  } catch (error) {
    // 일부 실패 허용: 에러 로그만 남기고 기본 리포트로 대체
    console.error(
      `❌ 리포트 생성 실패 (restaurantId: ${reviewData.restaurantId}):`,
      error
    );

    // 실패한 경우 기본 리포트 생성 (upsert 사용하여 중복 생성 방지)
    try {
      return await prisma.restaurantReport.upsert({
        where: { restaurantId: reviewData.restaurantId },
        update: {},
        create: {
          restaurantId: reviewData.restaurantId,
        },
      });
    } catch (fallbackError) {
      console.error(
        `❌ 기본 리포트 생성도 실패 (restaurantId: ${reviewData.restaurantId}):`,
        fallbackError
      );
      throw fallbackError;
    }
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
  // 1. 우선순위를 가중치로 변환
  const weightMap: Record<number, number> = {
    3: 3.0, // 1순위
    2: 2.0, // 2순위
    1: 1.0, // 3순위
    0: 0.0, // 미선택
  };

  const weights = {
    taste: weightMap[priorities.taste],
    price: weightMap[priorities.price],
    atmosphere: weightMap[priorities.atmosphere],
    service: weightMap[priorities.service],
    quantity: weightMap[priorities.quantity],
    accessibility: weightMap[priorities.accessibility],
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
