'use client';

import { RecommendationProgress } from '@/app/components/results/RecommendationProgress';
import { RestaurantCard } from '@/app/components/results/RestaurantCard';
import { ResultHeader } from '@/app/components/results/ResultHeader';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type {
  Recommendation,
  RecommendationProgressState,
} from '@/app/types/recommendations';
import type { PrioritySettings } from '@/app/types/search';
import { Button } from '@/components/ui/button';

export interface RecommendationsResultProps {
  city: City | null;
  food: Food | null;
  priorities: PrioritySettings | null;
  recommendations: Recommendation[];
  isLoading: boolean;
  error: Error | null;
  onBack: () => void;
  onNewSearch?: () => void;
  progress?: RecommendationProgressState;
}

/**
 * 추천 결과 메인 컴포넌트
 * 선택한 도시, 음식, 우선순위에 따른 음식점 추천 결과를 표시합니다.
 */
export function RecommendationsResult({
  city,
  food,
  priorities,
  recommendations,
  isLoading,
  error,
  onBack,
  onNewSearch,
  progress,
}: RecommendationsResultProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <ResultHeader city={city} food={food} priorities={priorities} />

      {isLoading && <RecommendationProgress progress={progress} />}

      {error && !isLoading && (
        <div className="restaurant-card w-full border border-red-200/60 bg-red-50/60 text-center py-8 space-y-3">
          <p className="text-red-600 font-semibold">Something went wrong</p>
          <p className="text-sm text-gray-600">{error.message}</p>
          <Button
            onClick={onBack}
            variant="ghost"
            className="border border-gray-200"
          >
            ← Back to Priority Selection
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((recommendation) => (
              <RestaurantCard
                key={recommendation.restaurant.id}
                rank={recommendation.rank}
                finalScore={recommendation.finalScore}
                restaurant={recommendation.restaurant}
                aiSummary={recommendation.report.aiSummary}
              />
            ))
          ) : (
            <div className="restaurant-card w-full border border-white/40 text-center py-10 space-y-2">
              <p className="text-gray-600">No recommendations found.</p>
              <Button
                onClick={onBack}
                variant="ghost"
                className="border border-gray-200"
              >
                ← Back to Priority Selection
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full sm:w-auto border border-gray-200"
        >
          ← Back to Priority Selection
        </Button>
        {onNewSearch && (
          <Button
            onClick={onNewSearch}
            variant="default"
            className="ai-recommendation w-full sm:w-auto px-6 py-5 font-semibold"
          >
            🔄 Start a new search
          </Button>
        )}
      </div>
    </div>
  );
}
