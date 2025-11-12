import {
  RecommendationRequest,
  RecommendationResponse,
  recommendationResponseSchema,
} from '../types/recommendations';

export function recommendationService() {
  const getRecommendations = async (
    data: RecommendationRequest
  ): Promise<RecommendationResponse> => {
    try {
      const response = await fetch('/api/restaurants/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get recommendations');
      }

      const responseData = await response.json();
      const validatedData = recommendationResponseSchema.parse(responseData);
      return validatedData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unknown error occurred', { cause: error });
    }
  };

  return {
    getRecommendations,
  };
}
