'use client';

import type { SelectedPriority } from '@/app/types/search';
import { PriorityItemComponent } from './PriorityItem';

export interface SelectedPrioritiesProps {
  selected: SelectedPriority[];
  onDeselect: (rank: 1 | 2 | 3) => void;
}

/**
 * 선택된 우선순위 (TOP 3) 컴포넌트
 * @param selected - 선택된 우선순위 리스트
 * @param onDeselect - 우선순위 해제 시 호출되는 함수
 */
export function SelectedPriorities({
  selected,
  onDeselect,
}: SelectedPrioritiesProps) {
  const getEmptySlot = (rank: 1 | 2 | 3) => {
    return (
      <div
        className={
          'priority-slot border border-dashed rounded-2xl p-6 text-center transition-all duration-200 border-gray-200 bg-white/60 hover:border-gray-300'
        }
      >
        <div className="flex flex-col items-center gap-1 sm:gap-2 text-gray-400 p-2 sm:p-4">
          <div className="text-xl sm:text-2xl">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </div>
          <div className="text-xs text-center">Empty</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        Ranked selection
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* 1순위 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 text-center block">
            1st Priority
          </label>
          {selected.find((s) => s.rank === 1) ? (
            <PriorityItemComponent
              item={selected.find((s) => s.rank === 1)!.item}
              rank={1}
              isSelected={true}
              onDeselect={onDeselect}
            />
          ) : (
            getEmptySlot(1)
          )}
        </div>

        {/* 2순위 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 text-center block">
            2nd Priority
          </label>
          {selected.find((s) => s.rank === 2) ? (
            <PriorityItemComponent
              item={selected.find((s) => s.rank === 2)!.item}
              rank={2}
              isSelected={true}
              onDeselect={onDeselect}
            />
          ) : (
            getEmptySlot(2)
          )}
        </div>

        {/* 3순위 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 text-center block">
            3rd Priority
          </label>
          {selected.find((s) => s.rank === 3) ? (
            <PriorityItemComponent
              item={selected.find((s) => s.rank === 3)!.item}
              rank={3}
              isSelected={true}
              onDeselect={onDeselect}
            />
          ) : (
            getEmptySlot(3)
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Tap to deselect
        </div>
      )}
    </div>
  );
}
