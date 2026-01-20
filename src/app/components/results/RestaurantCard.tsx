'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { openGoogleMaps } from '@/lib/googlePlaces';
import Image from 'next/image';
import { useState } from 'react';

export interface RestaurantCardProps {
  rank: number;
  finalScore: number;
  restaurant: {
    id: string;
    placeId: string;
    name: string | null;
    address: string | null;
    photoUrl: string | null;
  };
  aiSummary: string | null;
}

/**
 * 음식점 카드 컴포넌트
 * 랭킹, 사진, 음식점 정보, 최종 점수를 표시합니다.
 */
export function RestaurantCard({
  rank,
  finalScore,
  restaurant,
  aiSummary,
}: RestaurantCardProps) {
  // 이미지 로드 에러 상태 관리
  const [imageError, setImageError] = useState(false);
  // 점수에 따른 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-fresh-taste';
    if (score >= 70) return 'text-warm-taste';
    if (score >= 50) return 'text-sweet-taste';
    return 'text-gray-500';
  };

  // 랭킹 배지 배경색 결정
  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-warm-taste text-white';
    if (rank === 2) return 'bg-warm-taste/20 text-gray-900';
    if (rank === 3) return 'bg-warm-taste/10 text-gray-900';
    return 'bg-gray-100 text-gray-700';
  };

  // 구글맵 열기 핸들러
  const handleViewOnMap = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트와 분리
    if (restaurant.placeId) {
      openGoogleMaps(restaurant.placeId);
    }
  };

  return (
    <Card className="restaurant-card w-full hover:shadow-lg transition-all duration-300 pb-2">
      <CardContent className="relative p-4 md:p-6 md:pr-32 pb-3 md:pb-3">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* 왼쪽: 랭킹 배지 + 사진 + 모바일 점수 */}
          <div className="flex w-full md:w-auto items-start gap-3 md:gap-4">
            {/* 랭킹 배지 */}
            <div
              className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl ${getRankBadgeStyle(
                rank
              )}`}
            >
              {rank}
            </div>

            <div className="flex w-full md:w-auto items-start gap-3">
              {/* 사진 */}
              <div className="shrink-0">
                {restaurant.photoUrl && !imageError ? (
                  <Image
                    src={restaurant.photoUrl}
                    alt={restaurant.name || 'Restaurant'}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
                    width={96}
                    height={96}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-gray-200 flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
              </div>

              {/* 모바일: 사진 오른쪽 빈 공간 상단 점수 */}
              <div className="flex-1 md:hidden flex justify-end">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 text-lg font-semibold ${getScoreColor(
                    finalScore
                  )}`}
                >
                  ⭐ {finalScore.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* 중앙: 음식점 정보 */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* 음식점 이름 */}
            <h3 className="restaurant-name text-lg md:text-xl font-semibold text-gray-900 wrap-break-word leading-tight">
              {restaurant.name || ''}
            </h3>

            {/* 주소 */}
            {restaurant.address && (
              <p className="text-sm md:text-base text-gray-600 flex items-start gap-1.5">
                <span className="mt-0.5">🗺️</span>
                <span className="line-clamp-2">{restaurant.address}</span>
              </p>
            )}

            {/* AI Summary */}
            {aiSummary && (
              <p className="text-sm text-gray-500 italic line-clamp-2 flex items-start gap-1.5">
                <span className="mt-0.5">💬</span>
                <span>{aiSummary}</span>
              </p>
            )}

            {/* View on Map 버튼 */}
            <Button
              onClick={handleViewOnMap}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto mt-2 text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300 cursor-pointer"
            >
              <span className="mr-1.5">📍</span>
              View on Map
            </Button>
          </div>

          {/* 데스크톱: 카드 우측 상단 점수 */}
          <div className="hidden md:block absolute top-4 right-4">
            <div
              className={`text-2xl md:text-3xl font-bold ${getScoreColor(
                finalScore
              )}`}
            >
              ⭐ {finalScore.toFixed(1)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
