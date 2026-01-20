import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { recommendationApi } from '../api-client/recommendations';
import type {
  RecommendationProgressEvent,
  RecommendationRequest,
} from '../types/recommendations';

export function useRecommendation() {
  interface RecommendationMutationVariables {
    request: RecommendationRequest;
    onProgress?: (event: RecommendationProgressEvent) => void;
  }

  const {
    mutateAsync: getRecommendations,
    isPending: isGettingRecommendations,
  } = useMutation({
    mutationFn: ({ request, onProgress }: RecommendationMutationVariables) => {
      return recommendationApi().getRecommendations(request, {
        onProgress,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to get recommendations');
      throw error;
    },
  });

  return {
    getRecommendations,
    isGettingRecommendations,
  };
}
