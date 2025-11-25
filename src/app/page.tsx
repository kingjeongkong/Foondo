'use client';

import { RecommendationsResult } from '@/app/components/results/RecommendationsResult';
import { CitySelector } from '@/app/components/search/CitySelector';
import { FoodSelector } from '@/app/components/search/FoodSelector';
import { PrioritySelector } from '@/app/components/search/PrioritySelector';
import { useCity } from '@/app/hooks/useCity';
import { useFood } from '@/app/hooks/useFood';
import { useRecommendation } from '@/app/hooks/useRecommendation';
import type { City, CreateCityRequest } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type {
  Recommendation,
  RecommendationProgressEvent,
  RecommendationProgressState,
} from '@/app/types/recommendations';
import type { PrioritySettings } from '@/app/types/search';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useCallback, useState } from 'react';

const createInitialProgressState = (): RecommendationProgressState => ({
  SEARCH_RESTAURANTS: { status: 'pending' },
  COLLECT_REVIEWS: { status: 'pending' },
  ANALYZE_REPORTS: { status: 'pending' },
  CALCULATE_SCORES: { status: 'pending' },
});

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
  const [progressState, setProgressState] =
    useState<RecommendationProgressState>(() => createInitialProgressState());

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

  const handleProgressUpdate = useCallback(
    (event: RecommendationProgressEvent) => {
      setProgressState((prev) => ({
        ...prev,
        [event.step]: {
          status: event.status,
          meta: event.meta,
          message: event.message,
        },
      }));
    },
    []
  );

  const handlePriorityComplete = async (priorities: PrioritySettings) => {
    setSelectedPriorities(priorities);
    setCurrentStep('results');
    setRecommendationError(null);
    setProgressState(createInitialProgressState());

    if (selectedCity && selectedFood) {
      try {
        const result = await getRecommendations({
          request: {
            city: selectedCity,
            food: selectedFood,
            priorities,
          },
          onProgress: handleProgressUpdate,
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
      setProgressState(createInitialProgressState());
    }
  };

  const handleNewSearch = () => {
    setSelectedCity(null);
    setSelectedFood(null);
    setSelectedPriorities(null);
    setRecommendations([]);
    setRecommendationError(null);
    setProgressState(createInitialProgressState());
    setCurrentStep('city');
  };

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
          progress={progressState}
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
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <ProgressPanel
            steps={steps}
            currentStep={currentStep}
            selectedCity={selectedCity}
            selectedFood={selectedFood}
            selectedPriorities={selectedPriorities}
          />

          <main className="flex-1 min-w-0">
            <div className="flex justify-start w-full">{renderStepCard()}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
