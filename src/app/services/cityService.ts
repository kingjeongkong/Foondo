import { CityResponse, CreateCityRequest } from '../types/city';

export function cityService() {
  const createOrGetCity = async (
    data: CreateCityRequest
  ): Promise<CityResponse> => {
    try {
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create city');
      }

      return response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unknown error occurred', { cause: error });
    }
  };

  const getCity = async (id: string): Promise<CityResponse> => {
    try {
      const response = await fetch(`/api/cities/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch city');
      }

      return response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unknown error occurred', { cause: error });
    }
  };

  return {
    createOrGetCity,
    getCity,
  };
}
