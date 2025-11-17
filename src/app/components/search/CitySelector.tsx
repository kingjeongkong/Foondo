'use client';

import type { City } from '@/app/types/city';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

export interface CitySelectorProps {
  onCitySelect: (city: City) => void;
  onNext: () => void;
  selectedCity?: City | null;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * 도시 선택 컴포넌트
 * @param {Function} onCitySelect - 도시 선택 시 호출되는 콜백
 * @param {City | null} [selectedCity] - 현재 선택된 도시
 * @param {boolean} [disabled] - 비활성화 상태
 */
export function CitySelector({
  onCitySelect,
  onNext,
  selectedCity,
  disabled = false,
  isLoading = false,
}: CitySelectorProps) {
  const handleLocationSelect = (
    location: { city: string; country: string; location_id: string } | null
  ) => {
    if (disabled || !location) return;

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
    }
  };

  return (
    <Card className="restaurant-card w-full max-w-sm sm:max-w-md mx-auto">
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
              onClick={onNext}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : (
                `Get Recommendations of ${selectedCity.name}'s food`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
