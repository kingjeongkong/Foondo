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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Choose Your City</CardTitle>
        <CardDescription>
          Select the city where you want to find restaurants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedCity?.id || ''}
          onValueChange={handleCityChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a city..." />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}, {city.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading && (
          <div className="text-center text-sm text-gray-500">Loading...</div>
        )}
      </CardContent>
    </Card>
  );
}
