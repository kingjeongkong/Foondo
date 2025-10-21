'use client';

import type { PriorityItem } from '@/app/types/search';
import { Card, CardContent } from '@/components/ui/card';

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
      'priority-item priority-item-mobile transition-all duration-200 cursor-pointer';

    if (disabled) {
      baseStyles += ' opacity-50 cursor-not-allowed';
    } else if (isSelected) {
      baseStyles += ' border-warm-taste bg-warm-taste/5 shadow-md';
    } else {
      baseStyles += ' hover:border-warm-taste hover:shadow-md hover:scale-102';
    }

    return baseStyles;
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
    <Card className={getItemStyles()} onClick={handleClick}>
      <CardContent className="p-2 sm:p-3 relative">
        {getRankBadge()}

        <div className="flex flex-col items-center gap-1 sm:gap-2 text-center">
          <div className="text-xl sm:text-2xl">{item.emoji}</div>
          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
              {item.name}
            </h3>
            <p className="text-xs text-gray-500 truncate hidden sm:block">
              {item.description}
            </p>
          </div>

          {isSelected && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-warm-taste px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-warm-taste/10">
                {rank ? `${rank}순위` : 'Selected'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
