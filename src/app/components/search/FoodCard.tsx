'use client';

import type { Food } from '@/app/types/food';
import { Card, CardContent } from '@/components/ui/card';

export interface FoodCardProps {
  food: Food;
  onSelect: () => void;
  isLocal?: boolean;
  disabled?: boolean;
  isSelected?: boolean;
}

/**
 * 음식 카드 컴포넌트
 * @param {CommonFood | LocalFood} food - 음식 정보
 * @param {Function} onSelect - 선택 시 호출되는 콜백
 * @param {boolean} [isLocal] - 로컬 음식 여부
 * @param {boolean} [disabled] - 비활성화 상태
 * @param {boolean} [isSelected] - 선택 여부
 */
export function FoodCard({
  food,
  onSelect,
  isLocal = false,
  disabled = false,
  isSelected = false,
}: FoodCardProps) {
  return (
    <Card
      className={`food-card cursor-pointer hover:shadow-md transition-all duration-200 py-0 ${
        isLocal ? 'local-food' : 'common-food'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
        isSelected
          ? 'border-warm-taste ring-2 ring-warm-taste bg-warm-taste/5'
          : ''
      }`}
      onClick={disabled ? undefined : onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {food.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">{food.description}</p>
          </div>
          {isSelected && (
            <span className="text-xs font-medium text-warm-taste px-2 py-1 rounded-full bg-warm-taste/10">
              Selected
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
