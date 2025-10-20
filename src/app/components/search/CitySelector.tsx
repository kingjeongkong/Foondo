'use client';

import { CITIES } from '@/app/data/cities';
import type { City } from '@/app/types/search';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export interface CitySelectorProps {
  onCitySelect: (city: City) => void;
  selectedCity?: City | null;
  disabled?: boolean;
}

/**
 * 도시 선택 컴포넌트
 * @param {Function} onCitySelect - 도시 선택 시 호출되는 콜백
 * @param {City | null} [selectedCity] - 현재 선택된 도시
 * @param {boolean} [disabled] - 비활성화 상태
 */
export function CitySelector({
  onCitySelect,
  selectedCity,
  disabled = false,
}: CitySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCityChange = async (cityId: string) => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // 도시 ID로 찾기
      const city = CITIES.find((c) => c.id === cityId);
      if (city) {
        onCitySelect(city);
      }
    } catch (error) {
      console.error('도시 선택 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="restaurant-card w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="taste-title flex items-center gap-2">
          🍽️ Choose Your City
        </CardTitle>
        <CardDescription className="taste-description">
          Where would you like to discover amazing food?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedCity?.id || ''}
          onValueChange={handleCityChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="food-selection">
            <SelectValue placeholder="Select a city..." />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((city) => (
              <SelectItem
                key={city.id}
                value={city.id}
                className="flex items-center gap-2"
              >
                <span className="text-lg">🏙️</span>
                <span>
                  {city.name}, {city.country}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading && (
          <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            <span>Finding the best cities...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
