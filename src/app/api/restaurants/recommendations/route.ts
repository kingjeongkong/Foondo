import { recommendationRequestSchema } from '@/app/types/recommendations';
import { ReviewData } from '@/app/types/restaurant';
import {
  analyzeAndSaveRestaurantReport,
  calculateRestaurantScores,
  collectRestaurantReviews,
  getExistingRestaurantsByFood,
  searchAndSaveRestaurants,
} from '@/lib/services/restaurantService';
import { Restaurant, RestaurantReport } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
    const searchedRestaurants = await searchAndSaveRestaurants(
      city.id, // DB 저장 시 외래키로 사용
      city.name, // Google Places 검색용
      food.id, // 음식 ID (관계 저장용)
      food.name, // Google Places 검색용
      5 // 최대 5개 검색
    );
    console.log(
      `✅ 단계 1 완료: ${searchedRestaurants.length}개 음식점 저장됨`
    );

    // 단계 1.5: DB에서 해당 음식과 연결된 기존 음식점 조회
    console.log(`📝 단계 1.5 실행: 기존 음식점 조회`);
    const existingRestaurants = await getExistingRestaurantsByFood(food.id);
    console.log(
      `✅ 단계 1.5 완료: ${existingRestaurants.length}개 기존 음식점 조회됨`
    );

    // 새로 검색한 음식점에서 기존 음식점과 겹치는 것 제외
    // existingRestaurants는 이미 완전한 리포트가 있는 것이 확실하므로,
    // newRestaurants에서 겹치는 것은 리뷰 수집/분석이 불필요함
    const existingRestaurantIds = new Set(existingRestaurants.map((r) => r.id));
    const newRestaurants = searchedRestaurants.filter(
      (r) => !existingRestaurantIds.has(r.id)
    );

    const allRestaurants = [
      ...existingRestaurants,
      ...newRestaurants,
    ] as Restaurant[];
    console.log(
      `📊 총 ${allRestaurants.length}개 음식점 (신규: ${newRestaurants.length}, 기존: ${existingRestaurants.length})`
    );

    // 단계 2: 리뷰 수집
    // 새로운 음식점만 리뷰 수집 (기존 음식점은 이미 리포트가 있음)
    // 리뷰가 없는 경우에도 빈 배열로 반환하여 기본 리포트 생성 보장
    console.log(`📝 단계 2 실행: 리뷰 수집`);
    const reviewDataList = await collectRestaurantReviews(newRestaurants);
    console.log(`✅ 단계 2 완료: ${reviewDataList.length}개 음식점 처리됨`);

    // 단계 3: AI 분석 + 리포트 저장
    console.log(`📝 단계 3 실행: AI 분석 및 리포트 저장`);

    // 모든 음식점에 대해 리포트 생성 (리뷰가 있으면 AI 분석, 없으면 기본 리포트)
    // 일부 실패 허용, 에러 처리는 analyzeAndSaveRestaurantReport 내부에서 처리
    const reportPromises = reviewDataList.map((reviewData: ReviewData) =>
      analyzeAndSaveRestaurantReport(reviewData)
    );

    // 모든 Promise 실행 (일부 실패 허용)
    const reportResults = await Promise.allSettled(reportPromises);

    const successfulReports = reportResults.filter(
      (result: PromiseSettledResult<RestaurantReport>) =>
        result.status === 'fulfilled'
    ).length;

    console.log(
      `✅ 단계 3 완료: ${successfulReports}/${reviewDataList.length}개 리포트 저장 완료`
    );

    // 단계 4: 점수 계산 및 랭킹
    console.log(`📝 단계 4 실행: 점수 계산 및 랭킹`);

    // 1. 새로 생성된 리포트 추출
    const newReports = reportResults
      .filter(
        (result: PromiseSettledResult<RestaurantReport>) =>
          result.status === 'fulfilled'
      )
      .map(
        (result) => (result as PromiseFulfilledResult<RestaurantReport>).value
      );

    // 2. 모든 리포트 합치기
    // 새로 생성된 리포트 + 기존 음식점의 리포트
    const existingRestaurantReports = existingRestaurants
      .map((r) => r.report)
      .filter(
        (report): report is NonNullable<typeof report> => report !== null
      );

    const allReports = [...newReports, ...existingRestaurantReports];

    // 4. 점수 계산 및 랭킹
    // 모든 음식점(신규 + 기존)에 대해 랭킹
    const restaurantScores = calculateRestaurantScores(
      allRestaurants,
      allReports,
      priorities
    );

    console.log(
      `✅ 단계 4 완료: ${restaurantScores.length}개 음식점 랭킹 완료`
    );

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
            accessibilityScore: item.report.accessibilityScore,
            aiSummary: item.report.aiSummary,
          },
        })),
      },
      message: 'Recommendations generated successfully',
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
