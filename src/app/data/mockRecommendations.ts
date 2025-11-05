/**
 * 추천 결과 Mock 데이터 타입
 * API 응답 구조와 동일하게 정의
 */
export interface MockRecommendation {
  rank: number;
  finalScore: number;
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
}

/**
 * Mock 추천 데이터 생성 함수
 * @param count 생성할 추천 개수 (기본값: 5)
 * @returns Mock 추천 데이터 배열
 */
export function generateMockRecommendations(
  count: number = 5
): MockRecommendation[] {
  const mockData: MockRecommendation[] = [
    {
      rank: 1,
      finalScore: 85.5,
      restaurant: {
        id: 'mock-uuid-1',
        placeId: 'ChIJmock1',
        name: 'Seastar Fish & Chips',
        address: '123 Main Street, Bournemouth, UK',
        photoUrl: null,
      },
      report: {
        tasteScore: 88.5,
        priceScore: 82.0,
        atmosphereScore: 75.0,
        serviceScore: 90.0,
        quantityScore: 85.0,
        aiSummary:
          'Outstanding traditional fish and chips with friendly service and generous portions. Highly recommended by locals and tourists alike.',
      },
    },
    {
      rank: 2,
      finalScore: 82.3,
      restaurant: {
        id: 'mock-uuid-2',
        placeId: 'ChIJmock2',
        name: 'Golden Dragon Chinese Restaurant',
        address: '456 High Street, Bournemouth, UK',
        photoUrl: null,
      },
      report: {
        tasteScore: 85.0,
        priceScore: 78.5,
        atmosphereScore: 80.0,
        serviceScore: 82.0,
        quantityScore: 80.0,
        aiSummary:
          'Authentic Chinese cuisine with excellent flavors and attentive service. Great value for money with large portion sizes.',
      },
    },
    {
      rank: 3,
      finalScore: 79.8,
      restaurant: {
        id: 'mock-uuid-3',
        placeId: 'ChIJmock3',
        name: 'La Bella Italia',
        address: '789 Ocean Drive, Bournemouth, UK',
        photoUrl: null, // 사진 없는 경우 테스트용
      },
      report: {
        tasteScore: 82.0,
        priceScore: 75.0,
        atmosphereScore: 88.0,
        serviceScore: 78.0,
        quantityScore: 76.0,
        aiSummary:
          'Charming Italian restaurant with romantic atmosphere. Delicious pasta and pizza dishes with authentic Italian flavors.',
      },
    },
    {
      rank: 4,
      finalScore: 76.5,
      restaurant: {
        id: 'mock-uuid-4',
        placeId: 'ChIJmock4',
        name: 'Spice Garden Indian Cuisine',
        address: '321 Market Square, Bournemouth, UK',
        photoUrl: null,
      },
      report: {
        tasteScore: 80.0,
        priceScore: 72.0,
        atmosphereScore: 70.0,
        serviceScore: 75.0,
        quantityScore: 85.0,
        aiSummary:
          'Flavorful Indian dishes with generous portions. Affordable prices make it a popular choice for families and groups.',
      },
    },
    {
      rank: 5,
      finalScore: 74.2,
      restaurant: {
        id: 'mock-uuid-5',
        placeId: 'ChIJmock5',
        name: 'The Burger House',
        address: '654 Beach Road, Bournemouth, UK',
        photoUrl: null,
      },
      report: {
        tasteScore: 78.0,
        priceScore: 70.0,
        atmosphereScore: 68.0,
        serviceScore: 72.0,
        quantityScore: 75.0,
        aiSummary:
          'Classic burgers with fresh ingredients. Casual dining atmosphere perfect for quick meals and family outings.',
      },
    },
  ];

  // 요청한 개수만큼 반환
  return mockData.slice(0, count);
}
