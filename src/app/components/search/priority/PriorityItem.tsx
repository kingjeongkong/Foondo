'use client';

import type { PriorityItem } from '@/app/types/search';
import { Card, CardContent } from '@/components/ui/card';
import type { CSSProperties } from 'react';

export interface PriorityItemProps {
  item: PriorityItem;
  rank?: 1 | 2 | 3;
  isSelected?: boolean;
  disabled?: boolean;
  onSelect?: (item: PriorityItem) => void;
  onDeselect?: (rank: 1 | 2 | 3) => void;
}

/**
 * 개별 우선순위 항목 컴포넌트
 */
export function PriorityItemComponent({
  item,
  rank,
  isSelected = false,
  disabled = false,
  onSelect,
  onDeselect,
}: PriorityItemProps) {
  const handleClick = () => {
    if (disabled) return;

    if (isSelected && onDeselect && rank) {
      onDeselect(rank);
    } else if (!isSelected && onSelect) {
      onSelect(item);
    }
  };

  const getItemStyles = () => {
    let baseStyles =
      'priority-item priority-item-mobile transition-all duration-200 cursor-pointer relative overflow-hidden bg-white/70';

    if (disabled) {
      baseStyles += ' opacity-50 cursor-not-allowed';
    } else if (!isSelected) {
      baseStyles += ' hover:shadow-md hover:scale-102';
    }

    return baseStyles;
  };

  const getItemStyleProps = () => {
    if (!isSelected) return undefined;

    return {
      borderColor: 'color-mix(in oklch, var(--color-primary-100) 65%, white)',
      background:
        'linear-gradient(135deg, color-mix(in oklch, var(--color-primary-100) 80%, white), #fff)',
      boxShadow:
        '0 10px 25px rgba(15, 23, 42, 0.08), 0 0 0 1px color-mix(in oklch, var(--color-primary-100) 65%, white)',
    } as CSSProperties;
  };

  const getRankBadge = () => {
    if (!rank || !isSelected) return null;

    const rankEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const rankColors = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-gray-100 text-gray-800',
      3: 'bg-orange-100 text-orange-800',
    };

    return (
      <div
        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankColors[rank]}`}
      >
        {rankEmojis[rank]}
      </div>
    );
  };

  return (
    <Card
      className={getItemStyles()}
      onClick={handleClick}
      style={getItemStyleProps()}
    >
      <CardContent className="p-3 sm:p-4 relative">
        {getRankBadge()}

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-2xl">{item.emoji}</div>
          <div className="flex-1 min-w-0 w-full space-y-1">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {item.name}
            </h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
