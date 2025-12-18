import { useRecommendation } from '@/app/hooks/useRecommendation';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type {
  Recommendation,
  RecommendationProgressEvent,
  RecommendationProgressState,
} from '@/app/types/recommendations';
import type { PrioritySettings } from '@/app/types/search';
import { useCallback, useState } from 'react';

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
 * @param priorities - 선택된 우선순위 설정
 * @param enabled - recommendations fetch 활성화 여부 (step === 'results'일 때만 true)
 */
export function useRecommendationFlow(
  city: City | null,
  food: Food | null,
  priorities: PrioritySettings | null,
  enabled: boolean = false
) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationError, setRecommendationError] = useState<Error | null>(
    null
  );
  const [progressState, setProgressState] =
    useState<RecommendationProgressState>(() => createInitialProgressState());

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
        });
        setRecommendations(result.data.recommendations);
        setRecommendationError(null);
      } catch (error) {
        setRecommendationError(error as Error);
        setRecommendations([]);
      }
    },
    [city, food, getRecommendations, handleProgressUpdate]
  );

  // 상태 초기화 함수
  const reset = useCallback(() => {
    setRecommendations([]);
    setRecommendationError(null);
    setProgressState(createInitialProgressState());
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
