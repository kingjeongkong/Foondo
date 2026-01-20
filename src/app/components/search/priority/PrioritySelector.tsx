'use client';

import { PRIORITY_ITEMS } from '@/app/data/constants/priorities';
import { usePrioritySelection } from '@/app/hooks/usePrioritySelection';
import type { PriorityItem, PrioritySettings } from '@/app/types/search';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvailablePriorities } from './AvailablePriorities';
import { SelectedPriorities } from './SelectedPriorities';

export interface PrioritySelectorProps {
  onComplete: (priorities: PrioritySettings) => void;
  onBack: () => void;
  disabled?: boolean;
}

/**
 * 우선순위 선택 메인 컴포넌트
 * @param onComplete - 우선순위 선택 완료 시 호출되는 함수
 * @param onBack - 뒤로가기 시 호출되는 함수
 * @param disabled - 우선순위 선택 비활성화 여부
 */
export function PrioritySelector({
  onComplete,
  onBack,
  disabled = false,
}: PrioritySelectorProps) {
  const {
    state,
    selectPriority,
    deselectPriority,
    isComplete,
    getPrioritySettings,
  } = usePrioritySelection(PRIORITY_ITEMS);

  // 항목 선택 처리
  const handleSelect = (item: PriorityItem) => {
    if (disabled) return;
    selectPriority(item);
  };

  // 항목 해제 처리
  const handleDeselect = (rank: 1 | 2 | 3) => {
    if (disabled) return;
    deselectPriority(rank);
  };

  // 완료 처리
  const handleComplete = () => {
    if (!isComplete) return;
    const priorities = getPrioritySettings();
    onComplete(priorities);
  };

  return (
    <Card className="restaurant-card w-full max-w-4xl border border-white/40">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Step 3
            </p>
            <CardTitle className="taste-title text-2xl">
              Rank your priorities
            </CardTitle>
          </div>
          <span className="text-xs text-gray-500">
            {state.selected.length}/3 selected
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SelectedPriorities
            selected={state.selected}
            onDeselect={handleDeselect}
          />
          <AvailablePriorities
            items={state.available}
            disabled={disabled}
            onSelect={handleSelect}
          />
        </div>

        <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-between pt-2">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={disabled}
            className="w-full sm:w-auto border border-gray-200 rounded-2xl py-5 text-gray-600"
          >
            ← Back to Food Selection
          </Button>
          <Button
            variant="default"
            className="ai-recommendation w-full sm:w-auto px-6 py-5 text-base font-semibold"
            onClick={handleComplete}
            disabled={disabled || !isComplete}
          >
            {isComplete
              ? 'Generate AI recommendations'
              : `Select ${3 - state.selected.length} more priority`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
