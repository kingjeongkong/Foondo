import { citySchema } from '@/app/types/city';
import { foodSchema } from '@/app/types/food';
import { searchAndSaveRestaurants } from '@/lib/services/restaurantService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 요청 데이터 검증 스키마
// API 요청용 스키마 (클라이언트에서 받는 데이터 구조에 맞춤)
const recommendationRequestSchema = z.object({
  city: citySchema,
  food: foodSchema,
  priorities: z.object({
    taste: z.number().min(0).max(3),
    atmosphere: z.number().min(0).max(3),
    price: z.number().min(0).max(3),
    distance: z.number().min(0).max(3),
    service: z.number().min(0).max(3),
    quantity: z.number().min(0).max(3),
  }),
});

/**
 * 음식점 추천 API
 *
 * 단계별 구현:
 * ✅ 단계 1: 음식점 검색 + DB 저장
 * ⏳ 단계 2: 리뷰 수집
 * ⏳ 단계 3: AI 분석 + 리포트 저장
 * ⏳ 단계 4: 점수 계산 및 랭킹
 *
 * POST /api/restaurants/recommendations
 * Body: { city: City, food: Food, priorities: PrioritySettings }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 데이터 검증 (DB 조회 없이 클라이언트에서 받은 데이터 사용)
    const validatedData = recommendationRequestSchema.parse(body);
    const { city, food, priorities } = validatedData;

    console.log(`🚀 음식점 추천 요청 시작: ${city.name} - ${food.name}`);

    // 단계 1: 음식점 검색 + DB 저장
    // cityId는 DB 저장 시 외래키로 사용, city.name, food.name은 검색 쿼리용
    console.log(`📝 단계 1 실행: 음식점 검색 및 DB 저장`);
    const restaurants = await searchAndSaveRestaurants(
      city.id, // DB 저장 시 외래키로 사용
      city.name, // Google Places 검색용
      food.name, // Google Places 검색용
      5 // 최대 5개 검색
    );

    console.log(`✅ 단계 1 완료: ${restaurants.length}개 음식점 저장됨`);

    // 현재는 단계 1만 구현되었으므로 기본 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        // 단계 1 결과
        restaurants: restaurants.map((r) => ({
          id: r.id,
          placeId: r.placeId,
          name: r.name,
          address: r.address,
          photoUrl: r.photoUrl,
          cityId: r.cityId,
        })),
        // 향후 단계 결과는 여기에 추가됨
        // recommendations: [], // 단계 4 완료 후
        // analysisResults: [], // 단계 3 완료 후
      },
      message: 'Step 1 completed: Restaurants searched and saved',
      metadata: {
        completedSteps: [1],
        totalRestaurants: restaurants.length,
      },
    });
  } catch (error) {
    console.error('❌ 음식점 추천 요청 실패:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
