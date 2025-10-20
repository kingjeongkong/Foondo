export interface MapboxLocation {
  id: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export interface MapboxGeocodingResponse {
  features: Array<{
    id: string;
    text: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
    context?: Array<{
      id: string;
      text: string;
      short_code?: string;
    }>;
  }>;
}

export interface MapboxSearchResult {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

/**
 * Mapbox Geocoding API를 사용하여 도시명으로 위치를 검색합니다.
 * @param query 검색할 도시명
 * @returns 검색 결과 배열
 */
export async function searchLocations(
  query: string
): Promise<MapboxSearchResult[]> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Mapbox access token is not configured');
  }

  if (!query.trim()) {
    return [];
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${accessToken}&types=place&language=en&limit=5`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Mapbox API error: ${response.status} ${response.statusText}`
      );
    }

    const data: MapboxGeocodingResponse = await response.json();

    console.log('Map box data', data);

    return data.features || [];
  } catch (error) {
    console.error('Mapbox 위치 검색 중 오류 발생:', error);
    throw new Error('위치 검색에 실패했습니다');
  }
}

/**
 * Mapbox Reverse Geocoding API를 사용하여 좌표로부터 위치 정보를 가져옵니다.
 * @param lat 위도
 * @param lng 경도
 * @returns 표준화된 위치 정보
 */
export async function getLocationFromCoordinates(
  lat: number,
  lng: number
): Promise<MapboxLocation> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Mapbox access token is not configured');
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=place,locality,region,country&language=en`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Mapbox API error: ${response.status} ${response.statusText}`
      );
    }

    const data: MapboxGeocodingResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('주어진 좌표에 대한 위치를 찾을 수 없습니다');
    }

    const features = data.features;

    const placeFeature = features.find((f) => f.id.startsWith('place'));
    const localityFeature = features.find((f) => f.id.startsWith('locality'));

    const cityFeature = placeFeature || localityFeature;

    const stateFeature = features.find((f) => f.id.startsWith('region'));
    const countryFeature = features.find((f) => f.id.startsWith('country'));

    const primaryFeature = cityFeature || stateFeature || countryFeature;
    if (!primaryFeature) {
      throw new Error('응답에서 주요 위치 정보를 확인할 수 없습니다');
    }

    let state = stateFeature?.text || '';
    if (!state && primaryFeature.context) {
      const stateFromContext = primaryFeature.context.find((c) =>
        c.id.startsWith('region')
      )?.text;
      if (stateFromContext) {
        state = stateFromContext;
      }
    }

    return {
      id: primaryFeature.id,
      city: cityFeature?.text || '',
      state: state,
      country: countryFeature?.text || '',
      lat: lat,
      lng: lng,
    };
  } catch (error) {
    console.error('Mapbox 좌표에서 위치 정보 가져오기 오류:', error);
    throw new Error('Mapbox에서 위치 정보를 가져오는데 실패했습니다');
  }
}
