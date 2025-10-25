import { FoodResponse } from '../types/food';

export function foodService() {
  const getFoods = async (cityId: string): Promise<FoodResponse> => {
    try {
      const response = await fetch(`/api/foods?cityId=${cityId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch foods');
      }
      return response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to fetch foods', { cause: error });
    }
  };

  return {
    getFoods,
  };
}
