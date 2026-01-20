import { COMMON_FOODS } from '@/app/data/constants/foods';
import { foodApi } from '@/app/api-client/foods';
import { City } from '@/app/types/city';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCityFromCache } from './useCity';

export function useFood(city: City | null, enabled: boolean) {
  const { data: localFoods, isLoading: isLoadingFoods } = useQuery({
    queryKey: ['foods', city?.id],
    queryFn: () => foodApi().getFoods(city!),
    enabled: !!city && enabled,
    throwOnError: true,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
  });

  return {
    localFoods: localFoods?.data ?? [],
    isLoadingFoods,
  };
}

/**
 * URL의 foodId로 Food 객체를 복원하는 훅
 * COMMON_FOODS 또는 localFoods (React Query 캐시)에서 검색
 * @param cityId - 선택된 도시 ID (localFoods 조회용)
 * @param foodId - URL에서 가져온 food ID
 * @param enabled - localFoods 패칭 활성화 여부 (food step일 때만 true)
 * @returns Food 객체 또는 null (찾을 수 없을 경우), isLoading 상태
 */
export function useFoodFromCache(
  cityId: string | null,
  foodId: string | null,
  enabled: boolean = false
) {
  // cityId로부터 City 객체 복원 (localFoods 조회용)
  const { city: selectedCity, isLoading: isLoadingCity } =
    useCityFromCache(cityId);

  // localFoods 조회 (enabled가 true일 때만 패칭)
  const { localFoods, isLoadingFoods } = useFood(
    selectedCity,
    enabled && !!cityId
  );

  // foodId로 Food 객체 찾기
  const food = useMemo(() => {
    if (!foodId) return null;

    // 1. COMMON_FOODS에서 먼저 검색
    const commonFood = COMMON_FOODS.find((f) => f.id === foodId);
    if (commonFood) {
      return commonFood;
    }

    // 2. localFoods에서 검색
    if (localFoods && localFoods.length > 0) {
      const localFood = localFoods.find((f) => f.id === foodId);
      if (localFood) {
        return localFood;
      }
    }

    return null;
  }, [foodId, localFoods]);

  // City 로딩 중이거나 Food 로딩 중이면 로딩 상태
  const isLoading = isLoadingCity || (enabled && !!cityId && isLoadingFoods);

  return {
    food,
    isLoading,
  };
}
