'use client';

import { PRIORITY_ITEMS } from '@/app/data/priorities';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type { PrioritySettings } from '@/app/types/search';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    <Card className="restaurant-card w-full max-w-4xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="taste-title flex items-center gap-2">
          🍽️ Recommendations
        </CardTitle>
        <CardDescription className="taste-description">
          {city && food ? (
            <>
              <span className="font-semibold text-gray-900">{food.name}</span>{' '}
              in{' '}
              <span className="font-semibold text-gray-900">
                {city.name}
                {city.country ? `, ${city.country}` : ''}
              </span>
            </>
          ) : (
            'Restaurant recommendations based on your preferences'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {topPriorities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Based on your priorities:
            </h3>
            <div className="flex flex-wrap gap-2">
              {topPriorities.map((priority, index) => (
                <div
                  key={priority.item.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warm-taste/10 border border-warm-taste/20"
                >
                  <span className="text-sm">
                    {priority.rank === 3
                      ? '🥇'
                      : priority.rank === 2
                        ? '🥈'
                        : '🥉'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {priority.item.emoji} {priority.item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
