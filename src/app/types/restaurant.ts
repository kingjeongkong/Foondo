import type { Restaurant, RestaurantReport } from '@prisma/client';

// Prisma 타입 재export (편의용)
export type { Restaurant, RestaurantReport };

export interface ReviewData {
  restaurantId: string;
  reviews: string[];
}

export interface ReviewCollectionResult {
  withReports: RestaurantReport[];
  withoutReports: ReviewData[];
}

export interface ScoredRestaurant {
  restaurant: Restaurant;
  report: RestaurantReport;
  finalScore: number;
  rank: number;
}
