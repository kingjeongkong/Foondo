import { cityService } from '@/app/services/cityService';
import type { City } from '@/app/types/city';
import { CreateCityRequest } from '@/app/types/city';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

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
    return queryClient.getQueryData(['city', cityId]) as City | undefined;
  };

  return {
    createOrGetCity,
    isCreatingCity,
    getCachedCity,
  };
}

/**
 * URL의 cityId로 React Query 캐시에서 City 객체를 복원하는 훅
 * 캐시에 없으면 서버에서 조회하여 새로고침 시에도 데이터 복구 가능
 * @param cityId - URL에서 가져온 city ID
 * @returns City 객체 또는 null (서버에도 없을 경우)
 */
export function useCityFromCache(cityId: string | null) {
  const queryClient = useQueryClient();

  const { data: city } = useQuery({
    queryKey: ['city', cityId],
    queryFn: async () => {
      if (!cityId) return null;

      // 1. 캐시에서 먼저 확인 (Optimistic check)
      const cached = queryClient.getQueryData<City>(['city', cityId]);
      if (cached) {
        return cached;
      }

      // 2. 캐시에 없으면 서버에서 조회 (새로고침 대비)
      try {
        const response = await cityService().getCity(cityId);
        if (response.success && response.data) {
          // 서버에서 가져온 데이터를 캐시에 저장
          queryClient.setQueryData(['city', cityId], response.data);
          return response.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to fetch city on restore:', error);
        return null;
      }
    },
    enabled: !!cityId,
    staleTime: 1000 * 60 * 60, // 1시간 동안은 fresh로 간주
    gcTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
  });

  return city ?? null;
}
