'use client';

import { COMMON_FOODS } from '@/app/data/foods';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import { FoodCard } from './FoodCard';

export interface FoodSelectorProps {
  localFoods: Food[];
  selectedCity: City;
  selectedFood?: Food | null;
  onFoodSelect: (food: Food) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * 음식 선택 컴포넌트
 * @param {Food[]} localFoods - 로컬 음식 목록
 * @param {City} selectedCity - 선택된 도시
 * @param {Food} selectedFood - 선택된 음식
 * @param {Function} onFoodSelect - 음식 선택 시 호출되는 콜백
 * @param {Function} onNext - 다음 단계로 이동 시 호출되는 콜백
 * @param {Function} onBack - 뒤로가기 시 호출되는 콜백
 * @param {boolean} [disabled] - 비활성화 상태
 * @param {boolean} [isLoading] - 로딩 상태
 */
export function FoodSelector({
  localFoods,
  selectedCity,
  selectedFood,
  onFoodSelect,
  onNext,
  onBack,
  disabled = false,
  isLoading = false,
}: FoodSelectorProps) {
  const [activeTab, setActiveTab] = useState<'common' | 'local'>('common');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 탭 변경 시 스크롤 위치를 최상단으로 리셋
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <Card className="restaurant-card w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="taste-title flex items-center gap-2">
          🍽️ What do you want to eat in {selectedCity.name}?
        </CardTitle>
        <CardDescription className="taste-description">
          Choose from common foods or local specialties
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* 모바일: 탭 방식 */}
        <div className="md:hidden">
          <div className="flex space-x-2 mb-4">
            <Button
              variant={activeTab === 'common' ? 'default' : 'outline'}
              className={`flex-1 ${
                activeTab === 'common'
                  ? 'bg-blue-200 text-blue-800 border-2 border-blue-300 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
              }`}
              onClick={() => setActiveTab('common')}
            >
              Common Foods
            </Button>
            <Button
              variant={activeTab === 'local' ? 'default' : 'outline'}
              className={`flex-1 ${
                activeTab === 'local'
                  ? 'bg-green-200 text-green-800 border-2 border-green-300 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100'
              }`}
              onClick={() => setActiveTab('local')}
            >
              Local Foods
            </Button>
          </div>

          <div
            ref={scrollContainerRef}
            className="space-y-2 max-h-70 overflow-y-auto p-3"
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
            {activeTab === 'local' && isLoading ? (
              <div className="flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* 데스크톱: 2열 그리드 */}
        <div className="hidden md:grid md:grid-cols-2 gap-8">
          {/* Common Foods Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Common Foods
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2">
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

          {/* Local Foods Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedCity.name}&apos;s Local Foods
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 items-center">
        <Button
          variant="outline"
          className="ai-recommendation"
          onClick={onNext}
          disabled={disabled || !selectedFood}
        >
          {selectedFood
            ? `Find ${selectedFood.name} restaurants`
            : 'Select a food'}
        </Button>
        <Button variant="outline" onClick={onBack} disabled={disabled}>
          ← Rechoose City
        </Button>
      </CardFooter>
    </Card>
  );
}
