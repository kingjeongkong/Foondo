import {
  RecommendationProgressEvent,
  RecommendationRequest,
  RecommendationResponse,
  recommendationResponseSchema,
  RecommendationStreamEvent,
} from '../types/recommendations';

export function recommendationApi() {
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
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      return new Promise<RecommendationResponse>((resolve, reject) => {
        const processStream = async () => {
          try {
            while (true) {
              // AbortSignal 체크: 요청이 취소되었는지 확인
              if (options?.signal?.aborted) {
                reader.cancel().catch(() => {});
                reject(new DOMException('Request was cancelled', 'AbortError'));
                return;
              }

              const { done, value } = await reader.read();

              if (done) {
                // 스트림이 끝났는데 result를 받지 못한 경우
                // AbortSignal이 활성화된 경우 AbortError로 처리
                if (options?.signal?.aborted) {
                  reject(new DOMException('Request was cancelled', 'AbortError'));
                } else {
                  reject(new Error('Stream ended without result'));
                }
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    continue;
                  }

                  try {
                    const event: RecommendationStreamEvent = JSON.parse(data);

                    if (event.type === 'progress' && options?.onProgress) {
                      options.onProgress(event);
                    } else if (event.type === 'result') {
                      const validated =
                        recommendationResponseSchema.parse(event.payload);
                      resolve(validated);
                      return;
                    } else if (event.type === 'error') {
                      reject(new Error(event.message));
                      return;
                    }
                  } catch (parseError) {
                    console.error('Failed to parse SSE event:', parseError);
                  }
                }
              }
            }
          } catch (error) {
            // AbortError인 경우 명확하게 처리
            if (
              error instanceof DOMException &&
              error.name === 'AbortError'
            ) {
              reject(error);
              return;
            }
            // fetch의 AbortError도 처리
            if (error instanceof Error && error.name === 'AbortError') {
              reject(new DOMException('Request was cancelled', 'AbortError'));
              return;
            }
            reject(error);
          }
        };

        processStream();
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to stream recommendations', { cause: error });
    }
  };

  const getRecommendations = async (
    data: RecommendationRequest,
    options?: {
      onProgress?: (event: RecommendationProgressEvent) => void;
      signal?: AbortSignal;
    }
  ): Promise<RecommendationResponse> => {
    return streamRecommendations(data, options);
  };

  return {
    streamRecommendations,
    getRecommendations,
  };
}
