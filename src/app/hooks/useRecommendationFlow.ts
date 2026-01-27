import { useRecommendation } from '@/app/hooks/useRecommendation';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type {
  Recommendation,
  RecommendationProgressEvent,
  RecommendationProgressState,
} from '@/app/types/recommendations';
import type { PrioritySettings } from '@/app/types/search';
import { useCallback, useEffect, useRef, useState } from 'react';

const createInitialProgressState = (): RecommendationProgressState => ({
  SEARCH_RESTAURANTS: { status: 'pending' },
  COLLECT_REVIEWS: { status: 'pending' },
  ANALYZE_REPORTS: { status: 'pending' },
  CALCULATE_SCORES: { status: 'pending' },
});

/**
 * Results 단계 전용 훅
 * Recommendations fetch 및 progress 상태 관리를 담당합니다.
 * @param city - 선택된 도시
 * @param food - 선택된 음식
 */
export function useRecommendationFlow(city: City | null, food: Food | null) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationError, setRecommendationError] = useState<Error | null>(
    null
  );
  const [progressState, setProgressState] =
    useState<RecommendationProgressState>(() => createInitialProgressState());

  const abortControllerRef = useRef<AbortController | null>(null);

  const { getRecommendations, isGettingRecommendations } = useRecommendation();

  // Progress 업데이트 핸들러
  const handleProgressUpdate = useCallback(
    (event: RecommendationProgressEvent) => {
      setProgressState((prev) => ({
        ...prev,
        [event.step]: {
          status: event.status,
          meta: event.meta,
          message: event.message,
        },
      }));
    },
    []
  );

  // Priority 완료 시 Recommendations fetch
  const handlePriorityComplete = useCallback(
    async (priorities: PrioritySettings) => {
      if (!city || !food) {
        return;
      }

      // 이전 요청이 진행 중이면 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setRecommendationError(null);
      setProgressState(createInitialProgressState());

      try {
        const result = await getRecommendations({
          request: {
            city,
            food,
            priorities,
          },
          onProgress: handleProgressUpdate,
          signal: abortController.signal,
        });

        setRecommendations(result.data.recommendations);
        setRecommendationError(null);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === 'AbortError' ||
            (error instanceof DOMException && error.name === 'AbortError'))
        ) {
          console.log('⚠️ Recommendation request aborted:', error.message);
          return;
        }

        setRecommendationError(error as Error);
        setRecommendations([]);
      }
    },
    [city, food, getRecommendations, handleProgressUpdate]
  );

  // 상태 초기화 함수
  const reset = useCallback(() => {
    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setRecommendations([]);
    setRecommendationError(null);
    setProgressState(createInitialProgressState());
  }, []);

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    recommendations,
    recommendationError,
    progressState,
    isLoading: isGettingRecommendations,
    handlePriorityComplete,
    reset,
  };
}
