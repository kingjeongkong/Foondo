'use client';

import { PRIORITY_ITEMS } from '@/app/data/constants/priorities';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type { PrioritySettings } from '@/app/types/search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ResultHeaderProps {
  city: City | null;
  food: Food | null;
  priorities: PrioritySettings | null;
}

/**
 * 추천 결과 헤더 컴포넌트
 * 선택한 도시, 음식, 우선순위 정보를 표시합니다.
 */
export function ResultHeader({ city, food, priorities }: ResultHeaderProps) {
  // 우선순위를 랭킹 순서로 정렬 (3, 2, 1순위만)
  const getTopPriorities = () => {
    if (!priorities) return [];

    const priorityArray = Object.entries(priorities)
      .map(([key, value]) => {
        const item = PRIORITY_ITEMS.find((p) => p.id === key);
        return {
          rank: value as number,
          item,
        };
      })
      .filter((entry) => entry.item && entry.rank > 0) // 0이 아닌 것만
      .sort((a, b) => b.rank - a.rank) // 내림차순 정렬
      .slice(0, 3); // 상위 3개만

    return priorityArray.map((entry) => ({
      rank: entry.rank as 1 | 2 | 3,
      item: entry.item!,
    }));
  };

  const topPriorities = getTopPriorities();

  return (
    <Card className="restaurant-card w-full border border-white/40 mb-6">
      <CardHeader className="pb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Step 4
        </p>
        <CardTitle className="taste-title text-2xl">
          Recommendations ready
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {(food || city) && (
          <div className="space-y-1 text-sm">
            {food && (
              <div className="flex gap-2 text-gray-600">
                <span className="uppercase tracking-[0.2em] text-[11px] text-gray-400">
                  Food
                </span>
                <span className="font-semibold text-gray-900">{food.name}</span>
              </div>
            )}
            {city && (
              <div className="flex gap-2 text-gray-600">
                <span className="uppercase tracking-[0.2em] text-[11px] text-gray-400">
                  City
                </span>
                <span className="font-semibold text-gray-900">
                  {city.name}
                  {city.country ? `, ${city.country}` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {topPriorities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topPriorities.map((priority) => (
              <div
                key={priority.item.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background:
                    'color-mix(in oklch, var(--color-primary-100) 75%, white)',
                  color: 'var(--color-primary-600)',
                }}
              >
                <span className="text-sm">
                  {priority.rank === 3
                    ? '🥇'
                    : priority.rank === 2
                      ? '🥈'
                      : '🥉'}
                </span>
                <span className="text-sm font-medium">
                  {priority.item.emoji} {priority.item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
