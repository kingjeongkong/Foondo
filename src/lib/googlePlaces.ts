import { z } from 'zod';

// Google Places API 응답 검증을 위한 Zod 스키마
const googlePlacePhotoSchema = z.object({
  photo_reference: z.string(),
  height: z.number(),
  width: z.number(),
});

const googlePlaceGeometrySchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

const googlePlaceResultSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  formatted_address: z.string(),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  photos: z.array(googlePlacePhotoSchema).optional(),
  price_level: z.number().optional(),
  geometry: googlePlaceGeometrySchema.optional(),
});

const googlePlacesTextSearchResponseSchema = z.object({
  results: z.array(googlePlaceResultSchema),
  status: z.string(),
  next_page_token: z.string().optional(),
});

const googlePlaceReviewSchema = z.object({
  author_name: z.string(),
  rating: z.number(),
  text: z.string(),
  time: z.number(),
  relative_time_description: z.string(),
});

const googlePlaceReviewsOnlyResponseSchema = z.object({
  result: z.object({
    reviews: z.array(googlePlaceReviewSchema).optional(),
  }),
  status: z.string(),
});

// 외부에서 사용되는 타입만 export
export type GooglePlaceReview = z.infer<typeof googlePlaceReviewSchema>;

// 표준화된 레스토랑 데이터 타입
export interface RestaurantData {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  photoReference?: string;
  priceLevel?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Google Places Text Search API를 사용하여 특정 도시와 음식에 대한 레스토랑을 검색합니다.
 * @param cityName 도시명
 * @param foodName 음식명
 * @param maxResults 최대 결과 수 (기본값: 20)
 * @returns 검색된 레스토랑 데이터 배열
 */
export async function searchRestaurantsByFood(
  cityName: string,
  foodName: string,
  maxResults: number = 5
): Promise<RestaurantData[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  if (!cityName.trim() || !foodName.trim()) {
    throw new Error('City name and food name are required');
  }

  // 검색 쿼리 구성: "도시명 음식명 맛집" 형태로 검색
  const query = `${foodName} restaurants in ${cityName}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${apiKey}&language=en`;

  try {
    console.log(`🔍 Google Places 검색 시작: "${query}"`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Places API error: ${response.status} ${response.statusText}`
      );
    }

    const rawData = await response.json();

    // Zod 스키마로 응답 검증
    const data = googlePlacesTextSearchResponseSchema.parse(rawData);

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    console.log(`✅ Google Places 검색 완료: ${data.results.length}개 결과`);

    // 결과를 표준화된 형태로 변환
    const restaurants: RestaurantData[] = data.results
      .slice(0, maxResults)
      .map((place) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        photoReference: place.photos?.[0]?.photo_reference,
        priceLevel: place.price_level,
        location: place.geometry?.location,
      }));

    return restaurants;
  } catch (error) {
    console.error('Google Places 레스토랑 검색 중 오류 발생:', error);

    if (error instanceof z.ZodError) {
      console.error('Google Places API 응답 검증 실패:', error.issues);
      throw new Error('Google Places API 응답 형식이 올바르지 않습니다');
    }

    throw new Error('레스토랑 검색에 실패했습니다');
  }
}

/**
 * Google Places Details API를 사용하여 특정 레스토랑의 리뷰만 가져옵니다.
 * 기본 정보는 searchRestaurantsByFood에서 받은 데이터를 사용합니다.
 * @param placeId Google Places place_id
 * @returns 리뷰 데이터만 반환
 */
export async function getRestaurantReviews(
  placeId: string
): Promise<GooglePlaceReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  if (!placeId.trim()) {
    throw new Error('place_id는 필수입니다');
  }

  // 리뷰 데이터만 요청
  const fields = 'reviews';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=en`;

  try {
    console.log(`🔍 Google Places 리뷰 조회: ${placeId}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Places API error: ${response.status} ${response.statusText}`
      );
    }

    const rawData = await response.json();

    // Zod 스키마로 응답 검증
    const data = googlePlaceReviewsOnlyResponseSchema.parse(rawData);

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const reviews: GooglePlaceReview[] = data.result.reviews || [];

    console.log(`✅ Google Places 리뷰 조회 완료: ${reviews.length}개 리뷰`);

    return reviews;
  } catch (error) {
    console.error('Google Places 리뷰 조회 중 오류 발생:', error);

    if (error instanceof z.ZodError) {
      console.error('Google Places API 응답 검증 실패:', error.issues);
      throw new Error('Google Places API 응답 형식이 올바르지 않습니다');
    }

    throw new Error('레스토랑 리뷰 조회에 실패했습니다');
  }
}

/**
 * 레스토랑 기본 정보와 리뷰를 결합합니다.
 * @param restaurant 기본 레스토랑 정보 (searchRestaurantsByFood에서 받은 데이터)
 * @param reviews 리뷰 데이터 (getRestaurantReviews에서 받은 데이터)
 * @returns 결합된 레스토랑 데이터
 */
export function combineRestaurantData(
  restaurant: RestaurantData,
  reviews: GooglePlaceReview[]
): {
  restaurant: RestaurantData;
  reviews: GooglePlaceReview[];
} {
  return {
    restaurant,
    reviews,
  };
}

/**
 * 여러 레스토랑의 리뷰를 병렬로 가져옵니다.
 * @param placeIds 레스토랑 place_id 배열
 * @returns 각 placeId에 해당하는 리뷰 배열 (일부 실패 허용)
 */
export async function getMultipleRestaurantReviews(placeIds: string[]): Promise<
  Array<{
    placeId: string;
    reviews: GooglePlaceReview[];
  }>
> {
  if (placeIds.length === 0) {
    return [];
  }

  console.log(`🔍 ${placeIds.length}개 레스토랑 리뷰 병렬 조회 시작`);

  try {
    // 병렬로 모든 레스토랑의 리뷰를 가져옴 (일부 실패 허용)
    const promises = placeIds.map(async (placeId) => {
      try {
        const reviews = await getRestaurantReviews(placeId);
        return {
          placeId,
          reviews: reviews || [],
        };
      } catch (error) {
        // 일부 실패 허용: 에러 로그만 남기고 빈 배열 반환
        console.error(`❌ 리뷰 조회 실패 (placeId: ${placeId}):`, error);
        return {
          placeId,
          reviews: [],
        };
      }
    });

    const results = await Promise.all(promises);

    console.log(`✅ ${results.length}개 레스토랑 리뷰 조회 완료`);

    return results;
  } catch (error) {
    console.error('여러 레스토랑 리뷰 조회 중 오류 발생:', error);
    throw new Error('레스토랑 리뷰 일괄 조회에 실패했습니다');
  }
}

/**
 * Google Places API 사용량을 확인합니다.
 * @returns API 사용량 정보
 */
export function getGooglePlacesUsageInfo(): {
  hasApiKey: boolean;
  apiKeyPrefix?: string;
} {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  return {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : undefined,
  };
}
