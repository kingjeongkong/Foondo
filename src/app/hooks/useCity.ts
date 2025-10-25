import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { cityService } from '../services/cityService';
import { CreateCityRequest } from '../types/city';

export function useCity() {
  const { mutateAsync: createCity, isPending: isCreatingCity } = useMutation({
    mutationFn: async (data: CreateCityRequest) => {
      const result = await cityService().createCity(data);
      if (result.success && result.data) {
        return result.data;
      }
    },
    onError: () => {
      toast.error('Failed to select city');
    },
  });

  return {
    createCity,
    isCreatingCity,
  };
}
