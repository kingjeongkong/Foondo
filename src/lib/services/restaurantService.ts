import {
  getMultipleRestaurantReviews,
  searchRestaurantsByFood,
} from '@/lib/googlePlaces';
import { prisma } from '@/lib/prisma';

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
