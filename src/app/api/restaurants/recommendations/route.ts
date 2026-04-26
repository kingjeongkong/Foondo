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
import { Restaurant } from '@prisma/client';
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
          const cutoff = new Date(Date.now() - TTL_DAYS * 86_400_000);

          // existingRestaurants는 getExistingRestaurantsByFood에서 tasteScore not null 필터로
          // 들어오지만 Prisma 타입상 report는 nullable. 안전하게 가드.
          const existingWithReport = existingRestaurants.flatMap((r) =>
            r.report ? [{ ...r, report: r.report }] : []
          );

          const staleSorted = existingWithReport
            .filter((r) => r.report.lastUpdated < cutoff)
            .sort(
              (a, b) =>
                a.report.lastUpdated.getTime() - b.report.lastUpdated.getTime()
            );
          const selectedStale = staleSorted.slice(0, STALE_REFRESH_LIMIT);

          if (staleSorted.length > 0) {
            const oldestDate = staleSorted[0].report.lastUpdated
              .toISOString()
              .slice(0, 10);
            console.log(
              `🔄 stale 후보 ${staleSorted.length}개 중 ${selectedStale.length}개 갱신 예정 (TTL ${TTL_DAYS}일, 가장 오래된 lastUpdated: ${oldestDate})`
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

          // 갱신 대상 식당의 기존 리포트 lookup용
          const existingReportMap = new Map(
            existingWithReport.map((r) => [r.id, r.report])
          );

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
                  existingReportMap.get(reviewData.restaurantId) ?? null
                )
              )
            );

            reportResults = await Promise.allSettled(reportPromises);

            const fulfilledCount = reportResults.filter(
              (r) => r.status === 'fulfilled'
            ).length;
            const rejectedCount = reportResults.filter(
              (r) => r.status === 'rejected'
            ).length;

            console.log(
              `✅ 단계 3 완료: fulfilled ${fulfilledCount}, rejected ${rejectedCount}`
            );

            completeStep('ANALYZE_REPORTS');
          }

          // 단계 4: 점수 계산 및 랭킹
          if (isAborted('CALCULATE_SCORES')) {
            return;
          }
          beginStep('CALCULATE_SCORES');

          const fulfilledResults = reportResults
            .filter(
              (r): r is PromiseFulfilledResult<ReportProcessResult> =>
                r.status === 'fulfilled'
            )
            .map((r) => r.value);

          const refreshedReports = fulfilledResults.flatMap((r) =>
            r.kind === 'created' || r.kind === 'updated' ? [r.report] : []
          );

          const deletedIds = new Set(
            fulfilledResults.flatMap((r) =>
              r.kind === 'deleted' ? [r.restaurantId] : []
            )
          );

          // 처리 결과 카운트 (created / updated / skipped / failed / deleted)
          const kindCounts = fulfilledResults.reduce<Record<string, number>>(
            (acc, r) => {
              acc[r.kind] = (acc[r.kind] ?? 0) + 1;
              return acc;
            },
            {}
          );
          if (fulfilledResults.length > 0) {
            console.log(
              `✅ 처리 결과: created ${kindCounts.created ?? 0} / updated ${kindCounts.updated ?? 0} / skipped ${kindCounts.skipped ?? 0} / deleted ${kindCounts.deleted ?? 0} / failed ${kindCounts.failed ?? 0}`
            );
          }

          // deletedIds 제외한 식당만 결과 후보
          const aliveExistingRestaurants = existingRestaurants.filter(
            (r) => !deletedIds.has(r.id)
          );
          const aliveNewRestaurants = newRestaurants.filter(
            (r) => !deletedIds.has(r.id)
          );

          const allRestaurants = [
            ...aliveExistingRestaurants,
            ...aliveNewRestaurants,
          ] as Restaurant[];

          const aliveExistingReports = aliveExistingRestaurants
            .map((r) => r.report)
            .filter(
              (report): report is NonNullable<typeof report> => report !== null
            );

          // 기존 → 갱신된 순서: calculateRestaurantScores 내부 Map dedup으로 갱신된 것이 덮어씀
          const allReports = [...aliveExistingReports, ...refreshedReports];

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
