'use client';

import { CitySelector } from '@/app/components/search/CitySelector';
import { FoodSelector } from '@/app/components/search/FoodSelector';
import { PrioritySelector } from '@/app/components/search/PrioritySelector';
import type { City, CreateCityRequest } from '@/app/types/city';
import type { SelectedFood } from '@/app/types/search';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCity } from './hooks/useCity';

/**
 * 메인 페이지 컴포넌트
 * AI 기반 맛집 추천 시스템의 진입점
 */
export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<Record<
    string,
    number
  > | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'city' | 'food' | 'priority' | 'results'
  >('city');

  const { createCity, isCreatingCity } = useCity();

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleFoodSelect = (food: SelectedFood) => {
    setSelectedFood(food);
  };

  const handlePriorityComplete = (priorities: Record<string, number>) => {
    setSelectedPriorities(priorities);
    setCurrentStep('results');
  };

  const handleNext = async () => {
    if (currentStep === 'city') {
      const requestData: CreateCityRequest = {
        mapboxId: selectedCity?.id ?? '',
        name: selectedCity?.name ?? '',
        country: selectedCity?.country ?? '',
      };
      await createCity(requestData).then(() => {
        setCurrentStep('food');
      });
    } else if (currentStep === 'food') {
      setCurrentStep('priority');
    }
  };

  const handleBack = () => {
    if (currentStep === 'food') {
      setCurrentStep('city');
    } else if (currentStep === 'priority') {
      setCurrentStep('food');
    } else if (currentStep === 'results') {
      setCurrentStep('priority');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="taste-title mb-4">🍽️ AI Restaurant Recommendation</h1>
          <p className="taste-description max-w-2xl mx-auto">
            Discover your perfect restaurant with AI-powered personalized
            recommendations
          </p>
        </div>

        {/* 단계별 컴포넌트 */}
        {currentStep === 'city' && (
          <div className="flex justify-center">
            <CitySelector
              onCitySelect={handleCitySelect}
              onNext={handleNext}
              selectedCity={selectedCity}
              isLoading={isCreatingCity}
            />
          </div>
        )}

        {currentStep === 'food' && selectedCity && (
          <div className="flex justify-center">
            <FoodSelector
              selectedCity={selectedCity}
              selectedFood={selectedFood}
              onFoodSelect={handleFoodSelect}
              onNext={handleNext}
              onBack={handleBack}
            />
          </div>
        )}

        {currentStep === 'priority' && selectedCity && selectedFood && (
          <div className="flex justify-center">
            <PrioritySelector
              onComplete={handlePriorityComplete}
              onBack={handleBack}
            />
          </div>
        )}

        {currentStep === 'results' && (
          <div className="flex flex-col gap-4 justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                🎉 Results Coming Soon!
              </h2>
              <p className="text-gray-600 mb-4">
                Your preferences: {selectedCity?.name}, {selectedFood?.name}
              </p>
              <p className="text-sm text-gray-500">
                Priority settings: {JSON.stringify(selectedPriorities)}
              </p>
            </div>
            <Button
              className="w-60 mx-auto"
              onClick={handleBack}
              variant="outline"
            >
              Back to Priority Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
