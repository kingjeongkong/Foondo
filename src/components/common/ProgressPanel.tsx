import type { Step } from '@/app/hooks/useFunnel';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type { PrioritySettings } from '@/app/types/search';
import { CheckIcon } from 'lucide-react';

const steps = [
  {
    key: 'city' as const,
    label: 'City Selection',
    description: 'Choose your destination',
  },
  {
    key: 'food' as const,
    label: 'Food Preferences',
    description: 'Pick a cuisine focus',
  },
  {
    key: 'priority' as const,
    label: 'Personalize Priorities',
    description: 'Rank what matters most',
  },
  {
    key: 'results' as const,
    label: 'Recommendations',
    description: 'Review curated spots',
  },
];

interface ProgressPanelProps<T extends Step> {
  currentStep: T;
  selectedCity: City | null;
  selectedFood: Food | null;
  selectedPriorities: PrioritySettings | null;
}

type StepStatus = 'complete' | 'current' | 'upcoming';

/**
 * 단계의 상태를 계산합니다.
 */
function getStepStatus(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * 진행 단계의 원형 숫자/체크마크 표시 컴포넌트
 */
interface StepIndicatorProps {
  index: number;
  status: StepStatus;
  size?: 'sm' | 'md';
}

function StepIndicator({ index, status, size = 'md' }: StepIndicatorProps) {
  const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full text-xs font-semibold ${
        status === 'complete'
          ? 'bg-green-100 text-green-700'
          : status === 'current'
            ? 'bg-primary-100 text-primary-600'
            : 'bg-gray-100 text-gray-400'
      }`}
      style={
        status === 'current'
          ? {
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-600)',
            }
          : undefined
      }
    >
      {status === 'complete' ? <CheckIcon className="size-4" /> : index + 1}
    </span>
  );
}

/**
 * 현재 선택 상태를 요약하여 표시하는 문자열을 생성합니다.
 * 우선순위 값 중 1 이상인 항목이 하나라도 있으면 Selected로 표시합니다.
 */
function formatPrioritySummary(priorities: PrioritySettings | null) {
  if (!priorities) {
    return 'Not selected';
  }

  const hasSelection = Object.values(priorities).some((rank) => rank > 0);
  return hasSelection ? 'Selected' : 'Not selected';
}

/**
 * Funnel 단계 진행 상황과 현재 선택 상태를 표시하는 패널
 */
export function ProgressPanel<T extends Step>({
  currentStep,
  selectedCity,
  selectedFood,
  selectedPriorities,
}: ProgressPanelProps<T>) {
  const currentIndex = Math.max(
    steps.findIndex((step) => step.key === currentStep),
    0
  );

  const prioritySummary = formatPrioritySummary(selectedPriorities);

  return (
    <aside className="progress-panel shrink-0">
      {/* 모바일: 간단한 progress 숫자 표시 */}
      <div className="md:hidden flex items-center justify-center gap-8">
        {steps.map((step, index) => {
          const status = getStepStatus(index, currentIndex);
          return (
            <div key={step.key} className="flex flex-col items-center gap-1">
              <StepIndicator index={index} status={status} size="md" />
              <span
                className={`text-xs font-medium ${
                  status === 'current'
                    ? 'text-primary-600'
                    : status === 'complete'
                      ? 'text-green-700'
                      : 'text-gray-400'
                }`}
                style={
                  status === 'current'
                    ? { color: 'var(--color-primary-600)' }
                    : undefined
                }
              >
                {step.key.charAt(0).toUpperCase() + step.key.slice(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* 데스크탑: 전체 패널 표시 */}
      <div className="hidden md:block space-y-5">
        <div>
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-xl font-semibold text-gray-900">
            Guided AI workflow
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(index, currentIndex);
            return (
              <div
                key={step.key}
                className={`progress-pill ${
                  status === 'current' ? 'progress-pill-active' : ''
                }`}
              >
                <StepIndicator index={index} status={status} size="sm" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {step.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-1">Session summary</p>
          <p>City: {selectedCity?.name ?? 'Not selected'}</p>
          <p>Food: {selectedFood?.name ?? 'Not selected'}</p>
          <p>Priorities: {prioritySummary}</p>
        </div>
      </div>
    </aside>
  );
}
