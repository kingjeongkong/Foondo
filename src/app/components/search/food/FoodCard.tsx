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
      className={`food-card cursor-pointer transition-all duration-200 py-0 ${
        isLocal ? 'local-food' : 'common-food'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onSelect}
      style={
        isSelected
          ? {
              borderColor:
                'color-mix(in oklch, var(--color-primary-100) 65%, white)',
              boxShadow:
                '0 0 0 2px color-mix(in oklch, var(--color-primary-100) 65%, white)',
              background:
                'color-mix(in oklch, var(--color-primary-100) 35%, white)',
            }
          : undefined
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-gray-900 truncate">
                {food.name}
              </h3>
              <span className="text-[9px] font-medium uppercase tracking-wide mt-1 text-gray-400">
                {isLocal && food.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {food.description}
            </p>
          </div>
          {isSelected && (
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{
                background:
                  'color-mix(in oklch, var(--color-primary-100) 70%, white)',
                color: 'var(--color-primary-600)',
              }}
            >
              Selected
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
