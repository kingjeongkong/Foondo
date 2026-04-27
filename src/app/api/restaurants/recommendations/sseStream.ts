import type {
  RecommendationProgressStep,
  RecommendationStreamEvent,
} from '@/app/types/recommendations';

/**
 * SSE 핸들러가 사용하는 헬퍼.
 * 비즈니스 로직과 인프라(controller, encoding, abort, progress event)를 분리하기 위해 추상화.
 */
export interface SseHelpers {
  /** SSE 이벤트 직접 전송 (controller closed 상태 안전 처리) */
  sendEvent: (event: RecommendationStreamEvent) => void;
  /** AbortSignal 취소 여부 (필요 시 stage 이름 로그) */
  isAborted: (stage?: RecommendationProgressStep) => boolean;
  /** 단계 시작 — `progress: running` 이벤트 + activeStep 갱신 */
  beginStep: (step: RecommendationProgressStep) => void;
  /** 단계 완료 — `progress: completed` 이벤트 + activeStep 해제 */
  completeStep: (
    step: RecommendationProgressStep,
    meta?: Record<string, unknown>
  ) => void;
}

interface CreateSseStreamOptions {
  abortSignal: AbortSignal;
  /**
   * 실제 비즈니스 로직.
   * 내부에서 throw하면 자동으로:
   *  1) 진행 중인 단계에 `progress: error` 이벤트 전송
   *  2) 최상위 `error` 이벤트 전송
   *  3) controller close
   */
  run: (helpers: SseHelpers) => Promise<void>;
}

/**
 * 추천 추론 스트림용 ReadableStream 팩토리.
 * controller / encoder / abort 처리 / progress 단계 추적 / 에러 핸들링을
 * 한 곳에 모아 비즈니스 로직(`run`)이 helpers만 받아 단순하게 작성될 수 있게 함.
 */
export function createSseStream(
  options: CreateSseStreamOptions
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const sendEvent: SseHelpers['sendEvent'] = (event) => {
        try {
          // controller가 이미 닫힌 경우 (e.g. 클라이언트 disconnect) 조용히 스킵
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
          // 그 외 예상 못 한 에러는 상위로 전파
          throw error;
        }
      };

      let activeStep: RecommendationProgressStep | null = null;

      const helpers: SseHelpers = {
        sendEvent,
        isAborted: (stage) => {
          if (options.abortSignal.aborted) {
            console.debug(
              '🚫 SSE stream aborted.',
              stage ? `Stopping before stage: ${stage}` : ''
            );
            return true;
          }
          return false;
        },
        beginStep: (step) => {
          activeStep = step;
          sendEvent({ type: 'progress', step, status: 'running' });
        },
        completeStep: (step, meta) => {
          sendEvent({ type: 'progress', step, status: 'completed', meta });
          if (activeStep === step) {
            activeStep = null;
          }
        },
      };

      try {
        await options.run(helpers);
      } catch (error) {
        console.error('❌ SSE stream 처리 실패:', error);
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        if (activeStep) {
          sendEvent({
            type: 'progress',
            step: activeStep,
            status: 'error',
            message,
          });
        }
        sendEvent({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });
}
