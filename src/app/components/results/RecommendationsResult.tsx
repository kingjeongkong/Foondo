'use client';

import { generateMockRecommendations } from '@/app/data/mockRecommendations';
import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type { PrioritySettings } from '@/app/types/search';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from './RestaurantCard';
import { ResultHeader } from './ResultHeader';

export interface RecommendationsResultProps {
  city: City | null;
  food: Food | null;
  priorities: PrioritySettings | null;
  onBack: () => void;
  onNewSearch?: () => void;
}

/**
 * 추천 결과 메인 컴포넌트
 * 선택한 도시, 음식, 우선순위에 따른 음식점 추천 결과를 표시합니다.
 */
export function RecommendationsResult({
  city,
  food,
  priorities,
  onBack,
  onNewSearch,
}: RecommendationsResultProps) {
  // Mock 데이터 생성 (나중에 API로 대체)
  const recommendations = generateMockRecommendations(5);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 헤더: 선택한 정보 요약 */}
      <ResultHeader city={city} food={food} priorities={priorities} />

      {/* 추천 결과 목록 */}
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
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No recommendations found.</p>
            <Button onClick={onBack} variant="outline">
              ← Back to Priority Selection
            </Button>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
        <Button onClick={onBack} variant="outline" className="w-full sm:w-auto">
          ← Back to Priority Selection
        </Button>
        {onNewSearch && (
          <Button
            onClick={onNewSearch}
            variant="outline"
            className="w-full sm:w-auto"
          >
            🔄 New Search
          </Button>
        )}
      </div>
    </div>
  );
}
