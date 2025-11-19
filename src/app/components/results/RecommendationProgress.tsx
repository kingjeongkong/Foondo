'use client';

import type {
  RecommendationProgressState,
  RecommendationProgressStep,
} from '@/app/types/recommendations';
import { motion } from 'framer-motion';

interface RecommendationProgressProps {
  progress?: RecommendationProgressState;
}

interface StepDefinition {
  key: RecommendationProgressStep;
  title: string;
}

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    key: 'SEARCH_RESTAURANTS',
    title: 'Searching for restaurants',
  },
  {
    key: 'COLLECT_REVIEWS',
    title: 'Collecting reviews',
  },
  {
    key: 'ANALYZE_REPORTS',
    title: 'Running AI analysis',
  },
  {
    key: 'CALCULATE_SCORES',
    title: 'Scoring and ranking',
  },
];

function getActiveStep(progress?: RecommendationProgressState) {
  if (!progress) {
    return STEP_DEFINITIONS[0];
  }

  const running = STEP_DEFINITIONS.find(
    (step) => progress[step.key]?.status === 'running'
  );

  if (running) {
    return running;
  }

  const nextPending = STEP_DEFINITIONS.find(
    (step) => progress[step.key]?.status !== 'completed'
  );

  return nextPending ?? STEP_DEFINITIONS[STEP_DEFINITIONS.length - 1];
}

/**
 * 추천 단계 진행도를 미니멀하게 표시하는 컴포넌트
 * 스피너와 3단 텍스트 카루셀만 노출합니다.
 */
const STEP_HEIGHT = 22;
const VIEWPORT_HEIGHT = STEP_HEIGHT * 3;

export function RecommendationProgress({
  progress,
}: RecommendationProgressProps) {
  const activeStep = getActiveStep(progress);
  const activeIndex = STEP_DEFINITIONS.findIndex(
    (step) => step.key === activeStep.key
  );

  return (
    <div className="inline-flex w-full flex-col gap-6">
      <div className="flex items-center justify-center">
        <div className="ai-loader" aria-label="Progress indicator" />
      </div>

      <div
        className="relative overflow-hidden text-center"
        style={{ height: VIEWPORT_HEIGHT }}
      >
        <motion.div
          className="flex flex-col items-center"
          style={{
            paddingTop: STEP_HEIGHT,
            paddingBottom: STEP_HEIGHT,
          }}
          animate={{ y: -(activeIndex * STEP_HEIGHT) }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {STEP_DEFINITIONS.map((step, index) => {
            const distance = Math.abs(activeIndex - index);
            const isActive = distance === 0;
            const opacity = distance === 0 ? 1 : 0.55;
            const scale = distance === 0 ? 1 : 0.92;

            return (
              <motion.p
                key={step.key}
                className={`flex w-full items-center justify-center line-clamp-1 ${
                  isActive
                    ? 'text-base font-semibold text-gray-900'
                    : 'text-xs text-gray-500'
                }`}
                style={{ height: STEP_HEIGHT }}
                animate={{ opacity, scale }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {step.title}
              </motion.p>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
