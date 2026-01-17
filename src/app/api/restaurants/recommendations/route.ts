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
import pLimit from 'p-limit';
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
            food.name
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

          completeStep('SEARCH_RESTAURANTS');

          // 단계 2: 리뷰 수집
          beginStep('COLLECT_REVIEWS');

          let reviewDataList: ReviewData[];

          if (newRestaurants.length === 0) {
            // 새로운 음식점이 없으면 최소 지연 후 스킵
            await new Promise((resolve) => setTimeout(resolve, 500));
            reviewDataList = [];
            completeStep('COLLECT_REVIEWS');
          } else {
            reviewDataList = await collectRestaurantReviews(newRestaurants);
            completeStep('COLLECT_REVIEWS');
          }

          // 단계 3: AI 분석 + 리포트 저장
          beginStep('ANALYZE_REPORTS');

          let reportResults: PromiseSettledResult<RestaurantReport>[];

          const reportLimiter = pLimit(5);

          if (reviewDataList.length === 0) {
            // 리뷰 데이터가 없으면 최소 지연 후 스킵
            await new Promise((resolve) => setTimeout(resolve, 500));
            reportResults = [];
            completeStep('ANALYZE_REPORTS');
          } else {
            console.log(`📝 단계 3 실행: ${reviewDataList.length}개 음식점 리포트 생성 시작`);
            console.log(`🔍 pLimit 상태: activeCount=${reportLimiter.activeCount}, pendingCount=${reportLimiter.pendingCount}`);
            
            // 원래 코드로 되돌림 - 디버깅을 위해
            const reportPromises = reviewDataList.map((reviewData: ReviewData, index: number) => {
              console.log(`📦 Promise 생성 시작: [${index}] ${reviewData.restaurantId}`);
              
              const promise = reportLimiter(() => {
                console.log(`▶️ 함수 실행 시작: [${index}] ${reviewData.restaurantId}`);
                const result = analyzeAndSaveRestaurantReport(reviewData);
                console.log(`📊 함수 반환값 타입: [${index}] ${result instanceof Promise ? 'Promise' : typeof result}`);
                
                // Promise 상태 추적
                if (result instanceof Promise) {
                  result.then(
                    (value) => {
                      console.log(`✅ Promise fulfilled: [${index}] ${reviewData.restaurantId}`);
                    },
                    (error) => {
                      console.log(`❌ Promise rejected: [${index}] ${reviewData.restaurantId}`, error);
                    }
                  );
                }
                
                return result;
              });
              
              console.log(`📦 Promise 생성 완료: [${index}] ${reviewData.restaurantId}, promise 타입: ${promise instanceof Promise ? 'Promise' : typeof promise}`);
              
              // pLimit이 반환한 Promise 상태 추적
              promise.then(
                (value) => {
                  console.log(`✅ pLimit Promise fulfilled: [${index}] ${reviewData.restaurantId}`);
                },
                (error) => {
                  console.log(`❌ pLimit Promise rejected: [${index}] ${reviewData.restaurantId}`, error);
                }
              );
              
              return promise;
            });
            
            console.log(`⏳ ${reportPromises.length}개 리포트 생성 Promise 대기 중...`);
            console.log(`🔍 pLimit 상태 (Promise.allSettled 전): activeCount=${reportLimiter.activeCount}, pendingCount=${reportLimiter.pendingCount}`);
            
            // Promise.allSettled 시작 시간 기록
            const startTime = Date.now();
            console.log(`⏰ Promise.allSettled 시작: ${new Date().toISOString()}`);
            
            // 각 Promise의 상태를 주기적으로 체크
            const checkInterval = setInterval(() => {
              const pending = reportPromises.filter(p => {
                // Promise 상태를 확인하기 어려우므로, pLimit 상태로 추정
                return true; // 정확한 상태 확인은 어려움
              });
              console.log(`🔍 진행 상황 체크: activeCount=${reportLimiter.activeCount}, pendingCount=${reportLimiter.pendingCount}, 경과시간=${Date.now() - startTime}ms`);
            }, 5000); // 5초마다 체크
            
            try {
              reportResults = await Promise.allSettled(reportPromises);
              clearInterval(checkInterval);
              
              const endTime = Date.now();
              console.log(`✅ Promise.allSettled 완료: ${new Date().toISOString()}, 소요시간=${endTime - startTime}ms`);
              console.log(`🔍 pLimit 상태 (Promise.allSettled 후): activeCount=${reportLimiter.activeCount}, pendingCount=${reportLimiter.pendingCount}`);
              
              const fulfilledCount = reportResults.filter(r => r.status === 'fulfilled').length;
              const rejectedCount = reportResults.filter(r => r.status === 'rejected').length;
              console.log(`✅ 단계 3 완료: ${fulfilledCount}개 성공, ${rejectedCount}개 실패`);
              
              // 실패한 Promise 상세 정보
              if (rejectedCount > 0) {
                reportResults.forEach((result, index) => {
                  if (result.status === 'rejected') {
                    console.error(`❌ 실패한 Promise [${index}]:`, result.reason);
                  }
                });
              }
            } catch (error) {
              clearInterval(checkInterval);
              console.error(`❌ Promise.allSettled 에러:`, error);
              throw error;
            }
            
            completeStep('ANALYZE_REPORTS');
          }

          // 단계 4: 점수 계산 및 랭킹
          console.log(`📝 단계 4 실행: 점수 계산 및 랭킹 시작`);
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

          console.log(`🔢 점수 계산 시작: ${allRestaurants.length}개 음식점, ${allReports.length}개 리포트`);
          const restaurantScores = calculateRestaurantScores(
            allRestaurants,
            allReports,
            priorities
          );
          console.log(`✅ 점수 계산 완료: ${restaurantScores.length}개 결과`);

          await new Promise((resolve) => setTimeout(resolve, 300));
          completeStep('CALCULATE_SCORES');

          console.log(`📦 최종 결과 생성 시작: ${restaurantScores.length}개 추천`);
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

          console.log(`✅ 최종 결과 생성 완료, 클라이언트에 전송 시작`);
          sendEvent({
            type: 'result',
            payload,
          });
          console.log(`✅ 클라이언트에 전송 완료`);
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
