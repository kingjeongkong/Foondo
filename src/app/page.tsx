'use client';

import { RecommendationsResult } from '@/app/components/results/RecommendationsResult';
import { CitySelector } from '@/app/components/search/CitySelector';
import { FoodSelector } from '@/app/components/search/FoodSelector';
import { PrioritySelector } from '@/app/components/search/PrioritySelector';
import { useRecommendationFlow } from '@/app/hooks/useRecommendationFlow';
import { useSearchFlow } from '@/app/hooks/useSearchFlow';
import type { PrioritySettings } from '@/app/types/search';
import { FunnelComponent } from '@/components/common/Funnel';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { Suspense } from 'react';

// 앱 헤더 컴포넌트
function AppHeader() {
  return (
    <header className="app-header">
      <div>
        <p className="app-brand uppercase tracking-[0.3em] text-gray-500">
          Foondo
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="hidden sm:inline">Need help?</span>
        <button className="rounded-full border border-gray-200 px-4 py-1.5 hover:border-gray-300 transition">
          Contact Support
        </button>
      </div>
    </header>
  );
}

// 메인 페이지 컴포넌트
function HomeContent() {
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
  } = useRecommendationFlow(selectedCity, selectedFood);

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

  // step별로 다른 로딩 조건 적용
  const isLoading =
    step === 'city' || step === 'food'
      ? status.isLoadingCity 
      : status.isLoadingCity || status.isLoadingFood; 

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <ProgressPanel
          currentStep={step}
          selectedCity={selectedCity}
          selectedFood={selectedFood}
          selectedPriorities={selectedPriorities}
        />

        <main className="flex-1 min-w-0">
          <div className="flex justify-start w-full">
            {isLoading ? (
              <div className="restaurant-card w-full max-w-3xl border border-white/40 rounded-2xl p-8">
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <div className="ai-loader w-8 h-8" />
                  <p className="text-sm text-gray-500">
                    Loading...
                  </p>
                </div>
              </div>
            ) : (
              <FunnelComponent step={step}>
                <FunnelComponent.Step name="city">
                  <CitySelector
                    onCitySelect={handlers.handleCitySelect}
                    onNext={handlers.handleNext}
                    selectedCity={selectedCity}
                    isLoading={status.isCreatingCity}
                  />
                </FunnelComponent.Step>

                {selectedCity && (
                  <FunnelComponent.Step name="food">
                    <FoodSelector
                      selectedCity={selectedCity}
                      selectedFood={selectedFood}
                      onFoodSelect={handlers.handleFoodSelect}
                      onNext={handlers.handleNext}
                      onBack={handleBack}
                    />
                  </FunnelComponent.Step>
                )}

                {selectedCity && selectedFood && (
                  <FunnelComponent.Step name="priority">
                    <PrioritySelector
                      onComplete={handlePriorityComplete}
                      onBack={handleBack}
                    />
                  </FunnelComponent.Step>
                )}

                <FunnelComponent.Step name="results">
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
                </FunnelComponent.Step>
              </FunnelComponent>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="app-shell">
      <AppHeader />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="restaurant-card w-full max-w-3xl border border-white/40 rounded-2xl p-8">
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <div className="ai-loader w-8 h-8" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}
