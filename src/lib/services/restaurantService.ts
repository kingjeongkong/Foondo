import { searchRestaurantsByFood } from '@/lib/googlePlaces';
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
