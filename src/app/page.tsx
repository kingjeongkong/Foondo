'use client';

import { RecommendationsResult } from '@/app/components/results/RecommendationsResult';
import { CitySelector } from '@/app/components/search/CitySelector';
import { FoodSelector } from '@/app/components/search/FoodSelector';
import { PrioritySelector } from '@/app/components/search/PrioritySelector';
import { useRecommendationFlow } from '@/app/hooks/useRecommendationFlow';
import { useSearchFlow } from '@/app/hooks/useSearchFlow';
import type { PrioritySettings } from '@/app/types/search';
import { ProgressPanel } from '@/components/common/ProgressPanel';

/**
 * 메인 페이지 컴포넌트
 * AI 기반 맛집 추천 시스템의 진입점
 */
export default function Home() {
  // 검색 플로우 관리 (URL 동기화 포함)
  const { step, data, handlers, status } = useSearchFlow();
  const { selectedCity, selectedFood, selectedPriorities } = data;

  // Results 단계 전용 훅
  const {
    recommendations,
    recommendationError,
    progressState,
    isLoading: isGettingRecommendations,
    handlePriorityComplete: handleRecommendationComplete,
    reset: resetRecommendations,
  } = useRecommendationFlow(
    selectedCity,
    selectedFood,
    selectedPriorities,
    step === 'results'
  );

  // Priority 완료 핸들러 (step 이동 + Recommendations fetch)
  const handlePriorityComplete = async (priorities: PrioritySettings) => {
    // useSearchFlow의 handlePriorityComplete 호출 (step 이동)
    handlers.handlePriorityComplete(priorities);
    // useRecommendationFlow의 handlePriorityComplete 호출 (recommendations fetch)
    if (selectedCity && selectedFood) {
      await handleRecommendationComplete(priorities);
    }
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (step === 'results') {
      // results 단계에서 뒤로가기 시 recommendations 상태 초기화
      resetRecommendations();
    }
    handlers.handleBack();
  };

  // 새 검색 시작
  const handleNewSearch = () => {
    handlers.handleNewSearch();
    resetRecommendations();
  };

  const loadingIndicator = () => {
    return (
      <div className="restaurant-card w-full max-w-3xl border border-white/40 rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="ai-loader w-8 h-8" />
          <p className="text-sm text-gray-500">Loading city and food data...</p>
        </div>
      </div>
    );
  };

  const renderStepCard = () => {
    const isLoading = status.isLoadingCity || status.isLoadingFood;
    if (isLoading) {
      return loadingIndicator();
    }

    if (step === 'city') {
      return (
        <CitySelector
          onCitySelect={handlers.handleCitySelect}
          onNext={handlers.handleNext}
          selectedCity={selectedCity}
          isLoading={status.isCreatingCity}
        />
      );
    }

    if (step === 'food' && selectedCity) {
      return (
        <FoodSelector
          selectedCity={selectedCity}
          selectedFood={selectedFood}
          onFoodSelect={handlers.handleFoodSelect}
          onNext={handlers.handleNext}
          onBack={handleBack}
        />
      );
    }

    if (step === 'priority' && selectedCity && selectedFood) {
      return (
        <PrioritySelector
          onComplete={handlePriorityComplete}
          onBack={handleBack}
        />
      );
    }

    if (step === 'results') {
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
            currentStep={step}
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
