'use client';

import { COMMON_FOODS } from '@/app/data/foods';
import { useFood } from '@/app/hooks/useFood';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import { FoodCard } from './FoodCard';

export interface FoodSelectorProps {
  selectedCity: City;
  selectedFood?: Food | null;
  onFoodSelect: (food: Food) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

/**
 * 음식 선택 컴포넌트
 * @param {City} selectedCity - 선택된 도시
 * @param {Food} selectedFood - 선택된 음식
 * @param {Function} onFoodSelect - 음식 선택 시 호출되는 콜백
 * @param {Function} onNext - 다음 단계로 이동 시 호출되는 콜백
 * @param {Function} onBack - 뒤로가기 시 호출되는 콜백
 * @param {boolean} [disabled] - 비활성화 상태
 */
export function FoodSelector({
  selectedCity,
  selectedFood,
  onFoodSelect,
  onNext,
  onBack,
  disabled = false,
}: FoodSelectorProps) {
  // 내부에서 localFoods 데이터 fetching
  const { localFoods, isLoadingFoods } = useFood(selectedCity, true);
  const [activeTab, setActiveTab] = useState<'common' | 'local'>('common');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 탭 변경 시 스크롤 위치를 최상단으로 리셋
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <Card className="restaurant-card w-full max-w-4xl border border-white/40">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Step 2
            </p>
            <CardTitle className="taste-title text-2xl">
              Choose what to eat in {selectedCity.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 모바일: 탭 방식 */}
        <div className="md:hidden space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={activeTab === 'common' ? 'default' : 'outline'}
              className={`rounded-2xl ${
                activeTab === 'common'
                  ? 'shadow-md text-white'
                  : 'border-gray-200 text-gray-600'
              }`}
              style={
                activeTab === 'common'
                  ? { backgroundColor: 'var(--color-primary-600)' }
                  : undefined
              }
              onClick={() => setActiveTab('common')}
            >
              Common Foods
            </Button>
            <Button
              type="button"
              variant={activeTab === 'local' ? 'default' : 'outline'}
              className={`rounded-2xl ${
                activeTab === 'local'
                  ? 'bg-emerald-500 text-white shadow hover:bg-emerald-500'
                  : 'border-gray-200 text-gray-600'
              }`}
              onClick={() => setActiveTab('local')}
            >
              Local Foods
            </Button>
          </div>

          <div
            ref={scrollContainerRef}
            className="max-h-80 overflow-y-auto space-y-3 rounded-2xl border border-gray-100 bg-white/60 p-3"
          >
            {activeTab === 'common' &&
              COMMON_FOODS.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onSelect={() => onFoodSelect(food)}
                  isLocal={false}
                  disabled={disabled}
                  isSelected={selectedFood?.id === food.id}
                />
              ))}
            {activeTab === 'local' && (
              <>
                {isLoadingFoods ? (
                  <div className="flex flex-col items-center justify-center py-10 text-sm text-gray-500 gap-3">
                    <div className="ai-loader" />
                    Loading local flavors...
                  </div>
                ) : localFoods.length > 0 ? (
                  localFoods.map((food) => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      onSelect={() => onFoodSelect(food)}
                      isLocal={true}
                      disabled={disabled}
                      isSelected={selectedFood?.id === food.id}
                    />
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-500 py-6">
                    No local foods available yet.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 데스크톱: 2열 그리드 */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <h3 className="text-base font-semibold text-gray-900">
                Common Foods
              </h3>
            </div>
            <div className="space-y-3 max-h-95 overflow-y-auto p-3 rounded-2xl border border-gray-100 bg-white/60">
              {COMMON_FOODS.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onSelect={() => onFoodSelect(food)}
                  isLocal={false}
                  disabled={disabled}
                  isSelected={selectedFood?.id === food.id}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <h3 className="text-base font-semibold text-gray-900">
                Local Foods
              </h3>
            </div>
            <div className="space-y-3 max-h-95 overflow-y-auto p-3 rounded-2xl border border-gray-100 bg-white/60">
              {isLoadingFoods ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-gray-500">
                  <div className="ai-loader" />
                  Loading local foods...
                </div>
              ) : localFoods.length > 0 ? (
                localFoods.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    onSelect={() => onFoodSelect(food)}
                    isLocal={true}
                    disabled={disabled}
                    isSelected={selectedFood?.id === food.id}
                  />
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-10">
                  No local foods detected.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 items-center sm:flex-row sm:justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={disabled}
          className="w-full sm:w-auto border border-gray-200 rounded-2xl py-5 text-gray-600"
        >
          ← Rechoose City
        </Button>
        <Button
          variant="default"
          className="ai-recommendation w-full sm:w-auto px-6 py-5 text-base font-semibold"
          onClick={onNext}
          disabled={disabled || !selectedFood}
        >
          {selectedFood
            ? `Find ${selectedFood.name} restaurants`
            : 'Select a food to continue'}
        </Button>
      </CardFooter>
    </Card>
  );
}
