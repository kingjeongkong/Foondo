import { z } from 'zod';

export const foodSchema = z.object({
  id: z.string().uuid(),
  cityId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  createdAt: z.coerce.date().nullable().optional(),
});

export const createFoodSchema = z.object({
  cityId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
});

export type Food = z.infer<typeof foodSchema>;
export type CreateFoodRequest = z.infer<typeof createFoodSchema>;

export interface FoodResponse {
  success: boolean;
  data?: Food[];
  error?: string;
  message?: string;
}
