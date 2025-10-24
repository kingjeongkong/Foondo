import { z } from 'zod';

export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().nullable(),
});

export const createCitySchema = z.object({
  mapboxId: z.string().min(1, 'Mapbox ID is required'),
  name: z.string().min(1, 'City name is required'),
  country: z.string().optional(),
});

export type City = z.infer<typeof citySchema>;
export type CreateCityRequest = z.infer<typeof createCitySchema>;

export interface CityResponse {
  success: boolean;
  data?: City;
  error?: string;
  message?: string;
}
