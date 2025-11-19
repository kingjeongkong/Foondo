import {
  RecommendationProgressEvent,
  RecommendationRequest,
  RecommendationResponse,
  recommendationResponseSchema,
  RecommendationStreamEvent,
} from '../types/recommendations';

export function recommendationService() {
  const streamRecommendations = async (
    data: RecommendationRequest,
    options?: {
      onProgress?: (event: RecommendationProgressEvent) => void;
      signal?: AbortSignal;
    }
  ): Promise<RecommendationResponse> => {
    try {
      const response = await fetch('/api/restaurants/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(data),
        signal: options?.signal,
      });

      if (!response.ok) {
        let message = 'Failed to get recommendations';

        try {
          const errorJson = await response.clone().json();
          message = errorJson.message || message;
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) {
              message = errorText;
            }
          } catch {
            // 텍스트 파싱에도 실패하면 기본 메시지를 사용
          }
        }

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Streaming is not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: RecommendationResponse | null = null;

      const processBuffer = () => {
        let boundary = buffer.indexOf('\n\n');

        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);

          if (rawEvent.startsWith('data:')) {
            const jsonPayload = rawEvent.slice(5).trim();
            if (jsonPayload) {
              const parsed = JSON.parse(
                jsonPayload
              ) as RecommendationStreamEvent;

              if (parsed.type === 'progress') {
                options?.onProgress?.(parsed as RecommendationProgressEvent);
              } else if (parsed.type === 'result') {
                finalResult = recommendationResponseSchema.parse(
                  parsed.payload
                );
              } else if (parsed.type === 'error') {
                throw new Error(
                  parsed.message || 'Failed to get recommendations'
                );
              }
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          buffer += decoder.decode();
          processBuffer();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }

      if (!finalResult) {
        throw new Error('No recommendation result received.');
      }

      return finalResult;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unknown error occurred', { cause: error });
    }
  };

  return {
    getRecommendations: streamRecommendations,
  };
}
