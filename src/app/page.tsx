'use client';

import { CitySelector } from '@/app/components/search/CitySelector';
import { FoodSelector } from '@/app/components/search/FoodSelector';
import type { City, SelectedFood } from '@/app/types/search';
import { useState } from 'react';

/**
 * 메인 페이지 컴포넌트
 * AI 기반 맛집 추천 시스템의 진입점
 */
export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'city' | 'food' | 'priority' | 'results'
  >('city');

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleFoodSelect = (food: SelectedFood) => {
    setSelectedFood(food);
  };

  const handleBack = () => {
    if (currentStep === 'food') {
      setCurrentStep('city');
    } else if (currentStep === 'priority') {
      setCurrentStep('food');
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
              onNext={() => setCurrentStep('food')}
              selectedCity={selectedCity}
            />
          </div>
        )}

        {currentStep === 'food' && selectedCity && (
          <div className="flex justify-center">
            <FoodSelector
              selectedCity={selectedCity}
              selectedFood={selectedFood}
              onFoodSelect={handleFoodSelect}
              onNext={() => setCurrentStep('priority')}
              onBack={handleBack}
            />
          </div>
        )}

        {/* TODO: priority, results 단계 추가 */}
      </div>
    </div>
  );
}
