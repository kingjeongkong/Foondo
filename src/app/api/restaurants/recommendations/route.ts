import { citySchema } from '@/app/types/city';
import { foodSchema } from '@/app/types/food';
import {
  analyzeAndSaveRestaurantReport,
  calculateRestaurantScores,
  collectRestaurantReviews,
  searchAndSaveRestaurants,
} from '@/lib/services/restaurantService';
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
 * ✅ 단계 2: 리뷰 수집
 * ✅ 단계 3: AI 분석 + 리포트 저장
 * ✅ 단계 4: 점수 계산 및 랭킹
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

    // 단계 2: 리뷰 수집
    console.log(`📝 단계 2 실행: 리뷰 수집`);
    const reviewsData = await collectRestaurantReviews(restaurants);

    console.log(
      `✅ 단계 2 완료: ${reviewsData.length}개 음식점 리뷰 수집 완료`
    );

    // 단계 3: AI 분석 + 리포트 저장
    console.log(`📝 단계 3 실행: AI 분석 및 리포트 저장`);

    // 병렬로 모든 음식점 처리 (일부 실패 허용)
    // 에러 처리는 analyzeAndSaveRestaurantReport 내부에서 처리
    const reportPromises = reviewsData.map((reviewData) =>
      analyzeAndSaveRestaurantReport(reviewData)
    );

    // 모든 Promise 실행 (일부 실패 허용)
    const reportResults = await Promise.allSettled(reportPromises);

    const successfulReports = reportResults.filter(
      (result) => result.status === 'fulfilled'
    ).length;

    console.log(
      `✅ 단계 3 완료: ${successfulReports}/${reviewsData.length}개 리포트 저장 완료`
    );

    // 단계 4: 점수 계산 및 랭킹
    console.log(`📝 단계 4 실행: 점수 계산 및 랭킹`);

    // 1. 성공한 리포트 추출
    const reports = reportResults
      .filter((result) => result.status === 'fulfilled')
      .map(
        (result) =>
          (result as PromiseFulfilledResult<typeof result.value>).value
      );

    // 2. 점수 계산 및 랭킹
    const restaurantScores = calculateRestaurantScores(
      restaurants,
      reports,
      priorities
    );

    console.log(
      `✅ 단계 4 완료: ${restaurantScores.length}개 음식점 랭킹 완료`
    );

    // 단계별 성공 여부 및 개수 계산
    const step1Success = restaurants.length > 0;
    const step2Success = reviewsData.length === restaurants.length;
    const step3Success = successfulReports === reviewsData.length;
    const step4Success = restaurantScores.length > 0;

    // 최종 추천 결과 반환
    return NextResponse.json({
      success: true,
      data: {
        recommendations: restaurantScores.map((item) => ({
          rank: item.rank,
          finalScore: Math.round(item.finalScore * 10) / 10, // 소수점 1자리
          restaurant: {
            id: item.restaurant.id,
            placeId: item.restaurant.placeId,
            name: item.restaurant.name,
            address: item.restaurant.address,
            photoUrl: item.restaurant.photoUrl,
          },
          report: {
            tasteScore: item.report.tasteScore,
            priceScore: item.report.priceScore,
            atmosphereScore: item.report.atmosphereScore,
            serviceScore: item.report.serviceScore,
            quantityScore: item.report.quantityScore,
            aiSummary: item.report.aiSummary,
          },
        })),
      },
      message:
        'Step 1-4 completed: Restaurants searched, reviews analyzed, and recommendations ranked',
      steps: {
        step1: {
          success: step1Success,
          count: step1Success ? restaurants.length : 0,
        },
        step2: {
          success: step2Success,
          count: step2Success ? reviewsData.length : 0,
        },
        step3: {
          success: step3Success,
          count: step3Success ? successfulReports : 0,
        },
        step4: {
          success: step4Success,
          count: step4Success ? restaurantScores.length : 0,
        },
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
