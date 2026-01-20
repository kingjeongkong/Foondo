'use client';

import type { PriorityItem } from '@/app/types/search';
import { PriorityItemComponent } from './PriorityItem';

export interface AvailablePrioritiesProps {
  items: PriorityItem[];
  disabled?: boolean;
  onSelect: (item: PriorityItem) => void;
}

/**
 * 선택 가능한 우선순위 목록 컴포넌트
 * @param items - 선택 가능한 우선순위 리스트
 * @param disabled - 우선순위 선택 비활성화 여부
 * @param onSelect - 우선순위 선택 시 호출되는 함수
 */
export function AvailablePriorities({
  items,
  disabled = false,
  onSelect,
}: AvailablePrioritiesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">
        Available options
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => (
          <PriorityItemComponent
            key={item.id}
            item={item}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>

      {items.length > 0 && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Tap to select
        </div>
      )}
    </div>
  );
}
