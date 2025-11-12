'use client';

import { RecommendationsResult } from '@/app/components/results/RecommendationsResult';
import { CitySelector } from '@/app/components/search/CitySelector';
import { FoodSelector } from '@/app/components/search/FoodSelector';
import { PrioritySelector } from '@/app/components/search/PrioritySelector';
import type { City, CreateCityRequest } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type { Recommendation } from '@/app/types/recommendations';
import type { PrioritySettings } from '@/app/types/search';
import { useState } from 'react';
import { useCity } from './hooks/useCity';
import { useFood } from './hooks/useFood';
import { useRecommendation } from './hooks/useRecommendation';

/**
 * 메인 페이지 컴포넌트
 * AI 기반 맛집 추천 시스템의 진입점
 */
export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedPriorities, setSelectedPriorities] =
    useState<PrioritySettings | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'city' | 'food' | 'priority' | 'results'
  >('city');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationError, setRecommendationError] = useState<Error | null>(
    null
  );

  const { createOrGetCity, isCreatingCity, getCachedCity } = useCity();
  const { localFoods, isLoadingFoods } = useFood(
    selectedCity,
    currentStep === 'food'
  );
  const { getRecommendations, isGettingRecommendations } = useRecommendation();

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
  };

  const handlePriorityComplete = async (priorities: PrioritySettings) => {
    setSelectedPriorities(priorities);
    setCurrentStep('results');
    setRecommendationError(null);

    if (selectedCity && selectedFood) {
      try {
        // TODO: 전송하는 데이터 수정 필요
        const result = await getRecommendations({
          city: selectedCity,
          food: selectedFood,
          priorities,
        });
        setRecommendations(result.data.recommendations);
        setRecommendationError(null);
      } catch (error) {
        setRecommendationError(error as Error);
        setRecommendations([]);
      }
    }
  };

  const handleNext = async () => {
    if (currentStep === 'city') {
      if (!selectedCity) {
        return;
      }

      // 캐시 확인 (이미 요청한 적이 있는 경우)
      const cachedCity = getCachedCity(selectedCity.id);
      if (cachedCity) {
        // 캐시에 있으면 바로 다음 단계로
        setCurrentStep('food');
        return;
      }

      // POST 요청 (서버에서 존재하면 반환, 없으면 생성)
      const requestData: CreateCityRequest = {
        id: selectedCity.id,
        name: selectedCity.name,
        country: selectedCity.country ?? '',
      };
      await createOrGetCity(requestData);
      setCurrentStep('food');
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

  const handleNewSearch = () => {
    setSelectedCity(null);
    setSelectedFood(null);
    setSelectedPriorities(null);
    setRecommendations([]);
    setRecommendationError(null);
    setCurrentStep('city');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 py-4 md:py-8">
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
              localFoods={localFoods}
              selectedCity={selectedCity}
              selectedFood={selectedFood}
              onFoodSelect={handleFoodSelect}
              onNext={handleNext}
              onBack={handleBack}
              isLoading={isLoadingFoods}
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
          <div className="flex justify-center">
            <RecommendationsResult
              city={selectedCity}
              food={selectedFood}
              priorities={selectedPriorities}
              recommendations={recommendations}
              isLoading={isGettingRecommendations}
              error={recommendationError}
              onBack={handleBack}
              onNewSearch={handleNewSearch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
