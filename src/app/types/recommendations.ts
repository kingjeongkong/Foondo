import { z } from 'zod';
import { citySchema } from './city';
import { foodSchema } from './food';

/**
 * 추천 결과 단일 항목 Zod 스키마
 */
export const recommendationSchema = z.object({
  rank: z.number().int().min(1),
  finalScore: z.number().min(0).max(100),
  restaurant: z.object({
    id: z.string(),
    placeId: z.string(),
    name: z.string().nullable(),
    address: z.string().nullable(),
    photoUrl: z.union([z.string().url(), z.null()]),
  }),
  report: z.object({
    tasteScore: z.number().min(0).max(100).nullable(),
    priceScore: z.number().min(0).max(100).nullable(),
    atmosphereScore: z.number().min(0).max(100).nullable(),
    serviceScore: z.number().min(0).max(100).nullable(),
    quantityScore: z.number().min(0).max(100).nullable(),
    aiSummary: z.string().nullable(),
  }),
});

/**
 * 추천 API 응답 Zod 스키마
 */
export const recommendationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    recommendations: z.array(recommendationSchema),
  }),
  message: z.string(),
});

/**
 * 추천 API 요청 Zod 스키마
 */
export const recommendationRequestSchema = z.object({
  city: citySchema,
  food: foodSchema,
  priorities: z.object({
    taste: z.number().min(0).max(3),
    atmosphere: z.number().min(0).max(3),
    price: z.number().min(0).max(3),
    accessibility: z.number().min(0).max(3),
    service: z.number().min(0).max(3),
    quantity: z.number().min(0).max(3),
  }),
});

/**
 * 추천 결과 단일 항목 타입
 * API 응답의 recommendation 객체 구조와 동일
 */
export type Recommendation = z.infer<typeof recommendationSchema>;

/**
 * 추천 API 응답 타입
 */
export type RecommendationResponse = z.infer<
  typeof recommendationResponseSchema
>;

/**
 * 추천 API 요청 타입
 */
export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;
