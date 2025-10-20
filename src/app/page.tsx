'use client';

import { CitySelector } from '@/app/components/search/CitySelector';
import type { City } from '@/app/types/search';
import { useState } from 'react';

/**
 * 메인 페이지 컴포넌트
 * AI 기반 맛집 추천 시스템의 진입점
 */
export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="taste-title mb-4">🍽️ AI Restaurant Recommendation</h1>
          <p className="taste-description max-w-2xl mx-auto">
            Discover your perfect restaurant with AI-powered personalized
            recommendations
          </p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex justify-center">
          <CitySelector
            onCitySelect={setSelectedCity}
            selectedCity={selectedCity}
          />
        </div>
      </div>
    </div>
  );
}
