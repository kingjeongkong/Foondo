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
      setSelectedCity(null);
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

  // 단계 진행 상태 계산
  const stepOrder: Array<typeof currentStep> = [
    'city',
    'food',
    'priority',
    'results',
  ];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const steps = [
    {
      key: 'city' as const,
      label: 'City Selection',
      description: 'Choose your destination',
    },
    {
      key: 'food' as const,
      label: 'Food Preferences',
      description: 'Pick a cuisine focus',
    },
    {
      key: 'priority' as const,
      label: 'Personalize Priorities',
      description: 'Rank what matters most',
    },
    {
      key: 'results' as const,
      label: 'Recommendations',
      description: 'Review curated spots',
    },
  ];

  const renderStepCard = () => {
    if (currentStep === 'city') {
      return (
        <CitySelector
          onCitySelect={handleCitySelect}
          onNext={handleNext}
          selectedCity={selectedCity}
          isLoading={isCreatingCity}
        />
      );
    }

    if (currentStep === 'food' && selectedCity) {
      return (
        <FoodSelector
          localFoods={localFoods}
          selectedCity={selectedCity}
          selectedFood={selectedFood}
          onFoodSelect={handleFoodSelect}
          onNext={handleNext}
          onBack={handleBack}
          isLoading={isLoadingFoods}
        />
      );
    }

    if (currentStep === 'priority' && selectedCity && selectedFood) {
      return (
        <PrioritySelector
          onComplete={handlePriorityComplete}
          onBack={handleBack}
        />
      );
    }

    if (currentStep === 'results') {
      return (
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
      );
    }

    return null;
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Foondo AI
          </p>
          <p className="app-brand">Culinary Intelligence Suite</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="hidden sm:inline">Need help?</span>
          <button className="rounded-full border border-gray-200 px-4 py-1.5 hover:border-gray-300 transition">
            Contact Support
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="progress-panel space-y-5">
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-xl font-semibold text-gray-900">
                Guided AI workflow
              </p>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const status =
                  index < currentStepIndex
                    ? 'complete'
                    : index === currentStepIndex
                      ? 'current'
                      : 'upcoming';

                return (
                  <div
                    key={step.key}
                    className={`progress-pill ${
                      status === 'current' ? 'progress-pill-active' : ''
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        status === 'complete'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      style={
                        status === 'current'
                          ? {
                              backgroundColor: 'var(--color-primary-100)',
                              color: 'var(--color-primary-600)',
                            }
                          : undefined
                      }
                    >
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-1">
                Session summary
              </p>
              <p>City: {selectedCity?.name ?? 'Not selected'}</p>
              <p>Food: {selectedFood?.name ?? 'Not selected'}</p>
              <p>
                Priorities:{' '}
                {selectedPriorities
                  ? Object.values(selectedPriorities)
                      .map((priority) => priority?.name)
                      .filter(Boolean)
                      .join(', ')
                  : 'Not selected'}
              </p>
            </div>
          </aside>

          <main className="flex-1 space-y-8">
            <div
              className="rounded-3xl border border-transparent p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              style={{
                background:
                  'linear-gradient(120deg, rgba(255,255,255,0.95), color-mix(in oklch, var(--color-primary-100) 60%, white), rgba(255,255,255,0.9))',
              }}
            >
              <h1 className="taste-title mb-3">AI Restaurant Recommendation</h1>
              <p className="taste-description max-w-2xl text-gray-600">
                Discover data-backed dining spots by moving through four guided
                steps. Foondo AI analyzes city context, food preferences, and
                your personal priorities to deliver precise restaurant hits.
              </p>
            </div>
            <div className="flex justify-center">{renderStepCard()}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
