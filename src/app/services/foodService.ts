import { City } from '@/app/types/city';
import { FoodResponse } from '@/app/types/food';

export function foodService() {
  const getFoods = async (city: City): Promise<FoodResponse> => {
    try {
      const response = await fetch('api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(city),
      });

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
