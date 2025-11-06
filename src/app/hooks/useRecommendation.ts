import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { recommendationService } from '../services/recommendationService';
import { RecommendationRequest } from '../types/recommendations';

export function useRecommendation() {
  const {
    mutateAsync: getRecommendations,
    isPending: isGettingRecommendations,
  } = useMutation({
    mutationFn: (data: RecommendationRequest) => {
      return recommendationService().getRecommendations(data);
    },
    onError: () => {
      toast.error('Failed to get recommendations');
      throw new Error('Failed to get recommendations');
    },
  });

  return {
    getRecommendations,
    isGettingRecommendations,
  };
}
