import type {
  RecommendationProgressStep,
  RecommendationResponse,
  RecommendationStreamEvent,
} from '@/app/types/recommendations';
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

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: RecommendationStreamEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        };

        let activeStep: RecommendationProgressStep | null = null;

        const emitProgress = (
          step: RecommendationProgressStep,
          status: 'running' | 'completed' | 'error',
          meta?: Record<string, unknown>,
          message?: string
        ) => {
          sendEvent({
            type: 'progress',
            step,
            status,
            meta,
            message,
          });
        };

        const beginStep = (step: RecommendationProgressStep) => {
          activeStep = step;
          emitProgress(step, 'running');
        };

        const completeStep = (
          step: RecommendationProgressStep,
          meta?: Record<string, unknown>
        ) => {
          emitProgress(step, 'completed', meta);
          if (activeStep === step) {
            activeStep = null;
          }
        };

        try {
          console.log(`🚀 음식점 추천 요청 시작: ${city.name} - ${food.name}`);

          // 단계 1: 음식점 검색 + DB 준비
          beginStep('SEARCH_RESTAURANTS');
          const searchedRestaurants = await searchAndSaveRestaurants(
            city.id,
            city.name,
            food.id,
            food.name,
            5
          );

          const existingRestaurants = await getExistingRestaurantsByFood(
            food.id
          );
          const existingRestaurantIds = new Set(
            existingRestaurants.map((r) => r.id)
          );
          const newRestaurants = searchedRestaurants.filter(
            (r) => !existingRestaurantIds.has(r.id)
          );

          const allRestaurants = [
            ...existingRestaurants,
            ...newRestaurants,
          ] as Restaurant[];

          completeStep('SEARCH_RESTAURANTS', {
            newCandidates: newRestaurants.length,
            existingWithReports: existingRestaurants.length,
            totalCandidates: allRestaurants.length,
          });

          // 단계 2: 리뷰 수집
          beginStep('COLLECT_REVIEWS');

          let reviewDataList: ReviewData[];
          let withReviewsCount = 0;
          let withoutReviewsCount = 0;

          if (newRestaurants.length === 0) {
            // 새로운 음식점이 없으면 최소 지연 후 스킵
            await new Promise((resolve) => setTimeout(resolve, 500));
            reviewDataList = [];
            completeStep('COLLECT_REVIEWS', {
              reviewTargets: 0,
              processed: 0,
              withReviews: 0,
              withoutReviews: 0,
              skipped: true,
              message: '기존 데이터 사용 중 (리뷰 수집 불필요)',
            });
          } else {
            reviewDataList = await collectRestaurantReviews(newRestaurants);
            withReviewsCount = reviewDataList.filter(
              (reviewData) => reviewData.reviews.length > 0
            ).length;
            withoutReviewsCount = reviewDataList.length - withReviewsCount;

            completeStep('COLLECT_REVIEWS', {
              reviewTargets: newRestaurants.length,
              processed: reviewDataList.length,
              withReviews: withReviewsCount,
              withoutReviews: withoutReviewsCount,
            });
          }

          // 단계 3: AI 분석 + 리포트 저장
          beginStep('ANALYZE_REPORTS');

          let reportResults: PromiseSettledResult<RestaurantReport>[];
          let successfulReports = 0;

          if (reviewDataList.length === 0) {
            // 리뷰 데이터가 없으면 최소 지연 후 스킵
            await new Promise((resolve) => setTimeout(resolve, 500));
            reportResults = [];
            successfulReports = existingRestaurants.length;
            completeStep('ANALYZE_REPORTS', {
              requestedReports: 0,
              successfulReports,
              skipped: true,
              message: '기존 리포트 사용 중 (분석 불필요)',
            });
          } else {
            const reportPromises = reviewDataList.map(
              (reviewData: ReviewData) =>
                analyzeAndSaveRestaurantReport(reviewData)
            );
            reportResults = await Promise.allSettled(reportPromises);
            successfulReports = reportResults.filter(
              (result: PromiseSettledResult<RestaurantReport>) =>
                result.status === 'fulfilled'
            ).length;

            completeStep('ANALYZE_REPORTS', {
              requestedReports: reviewDataList.length,
              successfulReports,
            });
          }

          // 단계 4: 점수 계산 및 랭킹
          beginStep('CALCULATE_SCORES');

          const newReports = reportResults
            .filter(
              (result: PromiseSettledResult<RestaurantReport>) =>
                result.status === 'fulfilled'
            )
            .map(
              (result) =>
                (result as PromiseFulfilledResult<RestaurantReport>).value
            );

          const existingRestaurantReports = existingRestaurants
            .map((r) => r.report)
            .filter(
              (report): report is NonNullable<typeof report> => report !== null
            );

          const allReports = [...newReports, ...existingRestaurantReports];

          const restaurantScores = calculateRestaurantScores(
            allRestaurants,
            allReports,
            priorities
          );

          await new Promise((resolve) => setTimeout(resolve, 300));
          completeStep('CALCULATE_SCORES', {
            rankedCount: restaurantScores.length,
          });

          const payload: RecommendationResponse = {
            success: true,
            data: {
              recommendations: restaurantScores.map((item) => ({
                rank: item.rank,
                finalScore: Math.round(item.finalScore * 10) / 10,
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
          };

          sendEvent({
            type: 'result',
            payload,
          });
        } catch (error) {
          console.error('❌ 음식점 추천 요청 실패:', error);
          if (activeStep) {
            emitProgress(
              activeStep,
              'error',
              undefined,
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
          sendEvent({
            type: 'error',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
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
