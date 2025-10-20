'use client';

import type { City } from '@/app/types/search';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import LocationAutocomplete from './LocationAutocomplete';

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

  const handleLocationSelect = (
    location: { city: string; country: string; location_id: string } | null
  ) => {
    if (disabled || isLoading || !location) return;

    setIsLoading(true);

    try {
      // Mapbox 결과를 City 타입으로 변환
      const city: City = {
        id: location.location_id,
        name: location.city,
        country: location.country,
      };

      onCitySelect(city);
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
        <LocationAutocomplete
          onSelect={handleLocationSelect}
          disabled={disabled}
        />

        {selectedCity && (
          <div className="flex items-center justify-center mt-5">
            <Button
              variant={'outline'}
              className="ai-recommendation p-4 animate-in slide-in-from-top-2 duration-300"
              onClick={() => {
                console.log('음식 목록 보여주기로 컴포넌트 교체');
              }}
              disabled={disabled || isLoading}
            >
              Get Recommendations of {selectedCity.name}&apos;s food
            </Button>
          </div>
        )}

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
