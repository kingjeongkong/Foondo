'use client';

import { PRIORITY_ITEMS } from '@/app/data/priorities';
import { usePrioritySelection } from '@/app/hooks/usePrioritySelection';
import type { PriorityItem } from '@/app/types/search';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AvailablePriorities } from './AvailablePriorities';
import { SelectedPriorities } from './SelectedPriorities';

export interface PrioritySelectorProps {
  onComplete: (priorities: Record<string, number>) => void;
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
    <Card className="restaurant-card w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="taste-title flex items-center gap-2">
          🎯 Set Your Priorities
        </CardTitle>
        <CardDescription className="taste-description">
          Choose your top 3 priorities for restaurant recommendations
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          {/* 선택된 우선순위 (TOP 3) */}
          <div className="space-y-4">
            <SelectedPriorities
              selected={state.selected}
              onDeselect={handleDeselect}
            />
          </div>

          {/* 선택 가능한 우선순위 */}
          <div className="space-y-4">
            <AvailablePriorities
              items={state.available}
              disabled={disabled}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2 items-center mt-6">
          <Button
            variant="outline"
            className="ai-recommendation"
            onClick={handleComplete}
            disabled={disabled || !isComplete}
          >
            {isComplete
              ? 'Get AI Recommendations'
              : `Select ${3 - state.selected.length} more priority`}
          </Button>
          <Button variant="outline" onClick={onBack} disabled={disabled}>
            ← Back to Food Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
