'use client';

import type { City } from '@/app/types/city';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="restaurant-card w-full max-w-3xl border border-white/40">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Step 1
            </p>
            <CardTitle className="taste-title text-2xl">
              Select a city
            </CardTitle>
          </div>
          {selectedCity && (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background:
                  'color-mix(in oklch, var(--color-primary-100) 70%, white)',
                color: 'var(--color-primary-600)',
              }}
            >
              {selectedCity.name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <LocationAutocomplete
          onSelect={handleLocationSelect}
          disabled={disabled}
          selectedCity={
            selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : ''
          }
        />

        {selectedCity ? (
          <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 text-sm text-gray-600">
            <p className="text-base font-semibold text-gray-900">
              {selectedCity.name}
            </p>
            <p>{selectedCity.country}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
            Start typing to choose a destination.
          </div>
        )}

        <Button
          variant={'default'}
          className="ai-recommendation w-full px-6 py-5 text-base font-semibold"
          onClick={onNext}
          disabled={disabled || !selectedCity || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="ai-loader w-4 h-4" />
            </span>
          ) : selectedCity ? (
            `Continue with ${selectedCity.name}`
          ) : (
            'Select a city to continue'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
