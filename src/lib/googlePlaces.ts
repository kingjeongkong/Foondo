// Google Places API 관련 타입 정의
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  price_level?: number;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface GooglePlacesTextSearchResponse {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
}

export interface GooglePlaceDetailsResponse {
  result: {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    geometry?: {
      location: {
        lat: number;
        lng: number;
      };
    };
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
      relative_time_description: string;
    }>;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
    price_level?: number;
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
  };
  status: string;
}

export interface GooglePlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

// 리뷰만 요청할 때 사용하는 최적화된 응답 타입
export interface GooglePlaceReviewsOnlyResponse {
  result: {
    reviews?: GooglePlaceReview[];
  };
  status: string;
}

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

    const data: GooglePlacesTextSearchResponse = await response.json();

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

    const data: GooglePlaceReviewsOnlyResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const reviews: GooglePlaceReview[] = data.result.reviews || [];

    console.log(`✅ Google Places 리뷰 조회 완료: ${reviews.length}개 리뷰`);

    return reviews;
  } catch (error) {
    console.error('Google Places 리뷰 조회 중 오류 발생:', error);
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
 * @param restaurants 기본 레스토랑 정보 배열 (searchRestaurantsByFood에서 받은 데이터)
 * @returns 레스토랑과 리뷰가 결합된 데이터 배열
 */
export async function getMultipleRestaurantReviews(
  restaurants: RestaurantData[]
): Promise<
  Array<{
    restaurant: RestaurantData;
    reviews: GooglePlaceReview[];
  }>
> {
  if (restaurants.length === 0) {
    return [];
  }

  console.log(`🔍 ${restaurants.length}개 레스토랑 리뷰 병렬 조회 시작`);

  try {
    // 병렬로 모든 레스토랑의 리뷰를 가져옴
    const promises = restaurants.map(async (restaurant) => {
      const reviews = await getRestaurantReviews(restaurant.placeId);
      return combineRestaurantData(restaurant, reviews);
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
