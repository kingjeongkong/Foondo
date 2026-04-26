import type { Restaurant, RestaurantReport } from '@prisma/client';
import type { GooglePlaceReviewsStatus } from '@/lib/googlePlaces';

// Prisma 타입 재export (편의용)
export type { Restaurant, RestaurantReport };

export interface ReviewData {
  restaurantId: string;
  /**
   * Google Places Details API 응답 status.
   * 호출자가 분기 처리 (OK+빈리뷰 SKIP, NOT_FOUND/INVALID_REQUEST 식당 삭제 등) 할 때 사용.
   */
  status: GooglePlaceReviewsStatus;
  reviews: string[];
}

export interface ScoredRestaurant {
  restaurant: Restaurant;
  report: RestaurantReport;
  finalScore: number;
  rank: number;
}
