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
  type ReportProcessResult,
} from '@/lib/server/restaurantService';
import {
  classifyExistingByTtl,
  mergeRecommendationResults,
  summarizeProcessResults,
} from '@/lib/server/recommendationService';
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

    const abortSignal = request.signal;

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: RecommendationStreamEvent) => {
          try {
            // 스트림 컨트롤러가 이미 닫힌 경우 이벤트 전송을 건너뜁니다.
            if (controller.desiredSize === null) {
              console.debug(
                '⚠️ SSE controller already closed. Skip sending event.',
                event.type
              );
              return;
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          } catch (error) {
            // 컨트롤러가 닫힌 상태에서 enqueue를 시도한 경우는 조용히 무시합니다.
            if (
              error instanceof TypeError &&
              typeof error.message === 'string' &&
              error.message.includes('closed')
            ) {
              console.debug(
                '⚠️ Failed to enqueue SSE event because controller is closed.',
                event.type
              );
              return;
            }

            // 그 외 예상하지 못한 에러는 상위 에러 핸들링으로 전달합니다.
            throw error;
          }
        };

        let activeStep: RecommendationProgressStep | null = null;

        const isAborted = (stage?: RecommendationProgressStep) => {
          if (abortSignal.aborted) {
            console.debug(
              '🚫 Recommendation request aborted.',
              stage ? `Stopping before stage: ${stage}` : ''
            );
            return true;
          }
          return false;
        };

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
          if (isAborted('SEARCH_RESTAURANTS')) {
            return;
          }
          beginStep('SEARCH_RESTAURANTS');
          const searchedRestaurants = await searchAndSaveRestaurants(
            city.id,
            city.name,
            food.id,
            food.name
          );

          const existingRestaurants = await getExistingRestaurantsByFood(
            food.id,
            city.id
          );
          const existingRestaurantIds = new Set(
            existingRestaurants.map((r) => r.id)
          );
          const newRestaurants = searchedRestaurants.filter(
            (r) => !existingRestaurantIds.has(r.id)
          );

          // TTL 분류: report.lastUpdated 기준으로 stale 식당을 가장 오래된 N개 선택
          const TTL_DAYS = parseInt(
            process.env.RESTAURANT_REPORT_TTL_DAYS ?? '30',
            10
          );
          const STALE_REFRESH_LIMIT = parseInt(
            process.env.RESTAURANT_REPORT_STALE_REFRESH_LIMIT ?? '5',
            10
          );

          const ttlClassification = classifyExistingByTtl(existingRestaurants, {
            ttlDays: TTL_DAYS,
            refreshLimit: STALE_REFRESH_LIMIT,
          });
          const { selectedStale, existingReportById } = ttlClassification;

          if (ttlClassification.totalStaleCount > 0 && ttlClassification.oldestStaleAt) {
            const oldestDate = ttlClassification.oldestStaleAt
              .toISOString()
              .slice(0, 10);
            console.log(
              `🔄 stale 후보 ${ttlClassification.totalStaleCount}개 중 ${selectedStale.length}개 갱신 예정 (TTL ${TTL_DAYS}일, 가장 오래된 lastUpdated: ${oldestDate})`
            );
          }

          completeStep('SEARCH_RESTAURANTS');

          // 단계 2: 리뷰 수집 (신규 + selectedStale 모두 대상)
          if (isAborted('COLLECT_REVIEWS')) {
            return;
          }
          beginStep('COLLECT_REVIEWS');

          const needsAnalysis = [...newRestaurants, ...selectedStale];

          let reviewDataList: ReviewData[];

          if (needsAnalysis.length === 0) {
            // 분석 대상이 없으면 최소 지연 후 스킵
            await new Promise((resolve) => setTimeout(resolve, 500));
            reviewDataList = [];
            completeStep('COLLECT_REVIEWS');
          } else {
            reviewDataList = await collectRestaurantReviews(needsAnalysis);
            completeStep('COLLECT_REVIEWS');
          }

          // 단계 3: AI 분석 + 리포트 저장
          if (isAborted('ANALYZE_REPORTS')) {
            return;
          }
          beginStep('ANALYZE_REPORTS');

          let reportResults: PromiseSettledResult<ReportProcessResult>[];

          const reportLimiter = pLimit(5);

          if (reviewDataList.length === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            reportResults = [];
            completeStep('ANALYZE_REPORTS');
          } else {
            console.log(
              `📝 단계 3 실행: ${reviewDataList.length}개 음식점 분석 시작 (신규 ${newRestaurants.length} / stale 갱신 ${selectedStale.length})`
            );

            const reportPromises = reviewDataList.map((reviewData) =>
              reportLimiter(() =>
                analyzeAndSaveRestaurantReport(
                  reviewData,
                  existingReportById.get(reviewData.restaurantId) ?? null
                )
              )
            );

            reportResults = await Promise.allSettled(reportPromises);
            completeStep('ANALYZE_REPORTS');
          }

          // 단계 4: 점수 계산 및 랭킹
          if (isAborted('CALCULATE_SCORES')) {
            return;
          }
          beginStep('CALCULATE_SCORES');

          const summary = summarizeProcessResults(reportResults);

          if (reportResults.length > 0) {
            const { created, updated, skipped, deleted, failed } =
              summary.kindCounts;
            console.log(
              `✅ 단계 3 완료: fulfilled ${reportResults.length - summary.rejectedCount}, rejected ${summary.rejectedCount}`
            );
            console.log(
              `✅ 처리 결과: created ${created} / updated ${updated} / skipped ${skipped} / deleted ${deleted} / failed ${failed}`
            );
          }

          const { allRestaurants, allReports } = mergeRecommendationResults({
            existingRestaurants,
            newRestaurants,
            refreshedReports: summary.refreshedReports,
            deletedIds: summary.deletedIds,
          });

          const restaurantScores = calculateRestaurantScores(
            allRestaurants,
            allReports,
            priorities
          );

          await new Promise((resolve) => setTimeout(resolve, 300));
          completeStep('CALCULATE_SCORES');

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
                  photoReference: item.restaurant.photoReference,
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
