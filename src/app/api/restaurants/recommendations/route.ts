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
import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { z } from 'zod';
import {
  buildRecommendationPayload,
  classifyExistingByTtl,
  mergeRecommendationResults,
  summarizeProcessResults,
} from './pipeline';
import { createSseStream } from './sseStream';

/**
 * 음식점 추천 API (SSE 스트림)
 *
 * 4단계 파이프라인:
 *  1) SEARCH_RESTAURANTS — Google textsearch + DB 저장 + TTL 분류
 *  2) COLLECT_REVIEWS    — 신규 + stale 갱신 대상의 리뷰 수집
 *  3) ANALYZE_REPORTS    — AI 분석 + 리포트 CREATE/UPDATE
 *  4) CALCULATE_SCORES   — 결과 병합 + 점수/랭킹
 *
 * POST /api/restaurants/recommendations
 * Body: { city: City, food: Food, priorities: PrioritySettings }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, food, priorities } = recommendationRequestSchema.parse(body);

    const stream = createSseStream({
      abortSignal: request.signal,
      run: async ({ sendEvent, isAborted, beginStep, completeStep }) => {
        console.log(`🚀 음식점 추천 요청 시작: ${city.name} - ${food.name}`);

        // ─── 단계 1: 음식점 검색 + DB 저장 + TTL 분류 ────────────────
        if (isAborted('SEARCH_RESTAURANTS')) return;
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

        if (
          ttlClassification.totalStaleCount > 0 &&
          ttlClassification.oldestStaleAt
        ) {
          const oldestDate = ttlClassification.oldestStaleAt
            .toISOString()
            .slice(0, 10);
          console.log(
            `🔄 stale 후보 ${ttlClassification.totalStaleCount}개 중 ${selectedStale.length}개 갱신 예정 (TTL ${TTL_DAYS}일, 가장 오래된 lastUpdated: ${oldestDate})`
          );
        }

        completeStep('SEARCH_RESTAURANTS');

        // ─── 단계 2: 리뷰 수집 ───────────────────────────────────
        if (isAborted('COLLECT_REVIEWS')) return;
        beginStep('COLLECT_REVIEWS');

        const needsAnalysis = [...newRestaurants, ...selectedStale];

        let reviewDataList: ReviewData[];
        if (needsAnalysis.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          reviewDataList = [];
        } else {
          reviewDataList = await collectRestaurantReviews(needsAnalysis);
        }
        completeStep('COLLECT_REVIEWS');

        // ─── 단계 3: AI 분석 + 리포트 CREATE/UPDATE ──────────────
        if (isAborted('ANALYZE_REPORTS')) return;
        beginStep('ANALYZE_REPORTS');

        const reportLimiter = pLimit(5);
        let reportResults: PromiseSettledResult<ReportProcessResult>[];

        if (reviewDataList.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          reportResults = [];
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
        }
        completeStep('ANALYZE_REPORTS');

        // ─── 단계 4: 결과 병합 + 점수/랭킹 ───────────────────────
        if (isAborted('CALCULATE_SCORES')) return;
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

        sendEvent({
          type: 'result',
          payload: buildRecommendationPayload(
            restaurantScores,
            'Recommendations generated successfully'
          ),
        });
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
