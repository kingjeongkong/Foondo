import { recommendationApi } from '@/app/api-client/recommendations';
import { useMutation } from '@tanstack/react-query';
import type {
  RecommendationProgressEvent,
  RecommendationRequest,
} from '../types/recommendations';

export function useRecommendation() {
  interface RecommendationMutationVariables {
    request: RecommendationRequest;
    onProgress?: (event: RecommendationProgressEvent) => void;
    signal?: AbortSignal;
  }

  const {
    mutateAsync: getRecommendations,
    isPending: isGettingRecommendations,
  } = useMutation({
    mutationFn: ({
      request,
      onProgress,
      signal,
    }: RecommendationMutationVariables) => {
      return recommendationApi().getRecommendations(request, {
        onProgress,
        signal,
      });
    },
    onError: (error: Error) => {
      throw error;
    },
  });

  return {
    getRecommendations,
    isGettingRecommendations,
  };
}
