import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { cityService } from '../services/cityService';
import { CreateCityRequest } from '../types/city';

export function useCity() {
  const queryClient = useQueryClient();

  const { mutateAsync: createOrGetCity, isPending: isCreatingCity } =
    useMutation({
      mutationFn: (data: CreateCityRequest) => {
        return cityService().createOrGetCity(data);
      },
      onSuccess: (response) => {
        // 성공 시 캐시에 저장 (같은 cityId로 재요청 시 캐시 사용)
        if (response.success && response.data) {
          queryClient.setQueryData(['city', response.data.id], response.data);
        }
      },
      onError: () => {
        toast.error('Failed to select city');
      },
    });

  // 캐시에서 도시 조회 (이미 요청한 적이 있는 경우)
  const getCachedCity = (cityId: string | null) => {
    if (!cityId) return null;
    return queryClient.getQueryData(['city', cityId]);
  };

  return {
    createOrGetCity,
    isCreatingCity,
    getCachedCity,
  };
}
