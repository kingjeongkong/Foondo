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
 * @param foodName 음식명
 * @param maxResults 최대 검색 결과 수 (기본값: 20)
 * @returns 저장된 레스토랑 배열
 */
export async function searchAndSaveRestaurants(
  cityId: string,
  cityName: string,
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

  // 2. DB에 저장 (upsert - placeId 기준으로 중복 방지)
  const savedRestaurants = await prisma.$transaction(
    restaurants.map((restaurant) =>
      prisma.restaurant.upsert({
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
      })
    )
  );

  console.log(`💾 ${savedRestaurants.length}개 음식점 DB 저장 완료`);

  return savedRestaurants;
}

/**
 * 여러 음식점의 리뷰를 수집합니다.
 * - 리뷰가 없는 음식점도 포함되며, reviews: []로 반환됩니다.
 * - 에러가 발생한 음식점도 포함되며, reviews: []로 반환됩니다.
 * @param restaurants 단계 1에서 저장된 음식점 배열 (DB 모델)
 * @returns 각 음식점의 리뷰 텍스트 배열 (모든 음식점 포함, 리뷰 없으면 [])
 */
export async function collectRestaurantReviews(
  restaurants: Array<{ id: string; placeId: string }>
): Promise<
  Array<{
    restaurantId: string; // DB의 restaurant.id
    placeId: string;
    reviews: string[]; // AI 분석용 텍스트만 추출 (리뷰 없으면 빈 배열)
  }>
> {
  if (restaurants.length === 0) {
    return [];
  }

  console.log(`📝 단계 2 실행: ${restaurants.length}개 음식점 리뷰 수집 시작`);

  // placeId 배열 추출
  const placeIds = restaurants.map((r) => r.placeId);

  // 병렬로 모든 음식점의 리뷰를 수집 (getMultipleRestaurantReviews 활용)
  const reviewsResults = await getMultipleRestaurantReviews(placeIds);

  // 모든 음식점에 대해 결과 생성 (리뷰 없어도 포함)
  const results = restaurants.map((restaurant) => {
    const reviewResult = reviewsResults.find(
      (r) => r.placeId === restaurant.placeId
    );

    // 리뷰 결과가 없거나 리뷰가 없으면 빈 배열
    if (
      !reviewResult ||
      !reviewResult.reviews ||
      reviewResult.reviews.length === 0
    ) {
      console.log(`⚠️ 리뷰 없음: ${restaurant.placeId}`);
      return {
        restaurantId: restaurant.id,
        placeId: restaurant.placeId,
        reviews: [], // 빈 배열로 반환
      };
    }

    // 리뷰 텍스트만 추출
    const reviewTexts = reviewResult.reviews
      .map((review) => review.text)
      .filter(Boolean);

    // 유효한 텍스트가 없으면 빈 배열
    if (reviewTexts.length === 0) {
      console.log(`⚠️ 유효한 리뷰 텍스트 없음: ${restaurant.placeId}`);
      return {
        restaurantId: restaurant.id,
        placeId: restaurant.placeId,
        reviews: [], // 빈 배열로 반환
      };
    }

    return {
      restaurantId: restaurant.id,
      placeId: restaurant.placeId,
      reviews: reviewTexts,
    };
  });

  const restaurantsWithReviews = results.filter((r) => r.reviews.length > 0);

  console.log(
    `✅ 단계 2 완료: ${restaurantsWithReviews.length}/${restaurants.length}개 음식점에 리뷰 있음 (나머지는 빈 배열)`
  );

  return results; // 모든 음식점 포함
}

/**
 * 음식점의 리뷰를 AI로 분석하고 리포트를 생성/업데이트합니다.
 * - 리뷰가 없는 경우: 기본 리포트 생성 (모든 점수 null)
 * - 리뷰가 있는 경우: 캐싱 확인 후 AI 분석 실행
 * @param reviewData 리뷰 데이터
 * @returns 생성/업데이트된 리포트
 */
export async function analyzeAndSaveRestaurantReport(reviewData: {
  restaurantId: string;
  placeId: string;
  reviews: string[];
}) {
  try {
    if (reviewData.reviews.length === 0) {
      // 리뷰 없음 → 기본 리포트 생성 (모든 점수 null)
      console.log(`📋 기본 리포트 생성: ${reviewData.restaurantId}`);
      return await prisma.restaurantReport.create({
        data: {
          restaurantId: reviewData.restaurantId,
        },
      });
    }

    // 리뷰 있음 → 기존 리포트 확인 후 AI 분석

    // 기존 리포트 확인 (캐싱)
    const existingReport = await prisma.restaurantReport.findUnique({
      where: { restaurantId: reviewData.restaurantId },
    });

    // 리포트가 있고 점수가 있으면 재분석 스킵 (캐싱)
    if (existingReport && existingReport.tasteScore !== null) {
      console.log(`⏭️ 리포트 존재 - 재분석 스킵: ${reviewData.restaurantId}`);
      // 추후 lastUpdated를 기준으로 시간 기반 재분석 로직 추가 가능
      return existingReport;
    }

    // 리포트가 없거나 점수가 null이면 AI 분석 실행
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

    // 실패한 경우 기본 리포트 생성
    try {
      return await prisma.restaurantReport.create({
        data: {
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
 * @param priorities 사용자 우선순위 설정 (distance 제외)
 * @returns 랭킹 정렬된 음식점 결과 배열
 */
export function calculateRestaurantScores(
  restaurants: Array<{
    id: string;
    placeId: string;
    name: string | null;
    address: string | null;
    photoUrl: string | null;
  }>,
  reports: Array<{
    restaurantId: string;
    tasteScore: number | null;
    priceScore: number | null;
    atmosphereScore: number | null;
    serviceScore: number | null;
    quantityScore: number | null;
    aiSummary: string | null;
  }>,
  priorities: PrioritySettings
): Array<{
  restaurant: {
    id: string;
    placeId: string;
    name: string | null;
    address: string | null;
    photoUrl: string | null;
  };
  report: {
    tasteScore: number | null;
    priceScore: number | null;
    atmosphereScore: number | null;
    serviceScore: number | null;
    quantityScore: number | null;
    aiSummary: string | null;
  };
  finalScore: number;
  rank: number;
}> {
  // 1. 우선순위를 가중치로 변환 (distance 제외)
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
  };

  const totalWeight =
    weights.taste +
    weights.price +
    weights.atmosphere +
    weights.service +
    weights.quantity;

  // 2. 음식점과 리포트를 매핑하고 최종 점수 계산
  const restaurantScores = restaurants
    .map((restaurant) => {
      const report = reports.find((r) => r.restaurantId === restaurant.id);

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
        report.quantityScore === null
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
          (report.quantityScore || 0) * weights.quantity;

        finalScore = weightedSum / totalWeight;
      }

      return {
        restaurant,
        report: {
          tasteScore: report.tasteScore,
          priceScore: report.priceScore,
          atmosphereScore: report.atmosphereScore,
          serviceScore: report.serviceScore,
          quantityScore: report.quantityScore,
          aiSummary: report.aiSummary,
        },
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
