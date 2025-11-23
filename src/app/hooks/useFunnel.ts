import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback } from 'react';

const STEPS = ['city', 'food', 'priority', 'results'] as const;

export type Step = (typeof STEPS)[number];

/**
 * Funnel 패턴을 위한 URL 동기화 훅
 * URL의 step 쿼리 파라미터와 상태를 동기화하고, step navigation 함수를 제공합니다.
 */
export function useFunnel() {
  // URL 쿼리 파라미터 'step'과 연동
  // history: 'push' 옵션은 브라우저 히스토리에 추가하여 뒤로가기 지원
  const [step, setStep] = useQueryState(
    'step',
    parseAsStringLiteral(STEPS)
      .withDefault('city')
      .withOptions({ history: 'push' })
  );

  // 다음 단계로 이동
  const next = useCallback(() => {
    setStep((prev) => {
      const currentIndex = STEPS.indexOf(prev);
      if (currentIndex < STEPS.length - 1) {
        return STEPS[currentIndex + 1];
      }
      return prev;
    });
  }, [setStep]);

  // 이전 단계로 이동
  const prev = useCallback(() => {
    setStep((prev) => {
      const currentIndex = STEPS.indexOf(prev);
      if (currentIndex > 0) {
        return STEPS[currentIndex - 1];
      }
      return prev;
    });
  }, [setStep]);

  return {
    step,
    setStep,
    next,
    prev,
  };
}
