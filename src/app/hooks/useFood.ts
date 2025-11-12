import { foodService } from '@/app/services/foodService';
import { City } from '@/app/types/city';
import { useQuery } from '@tanstack/react-query';

export function useFood(city: City | null, enabled: boolean) {
  const { data: localFoods, isLoading: isLoadingFoods } = useQuery({
    queryKey: ['foods', city?.id],
    queryFn: () => foodService().getFoods(city!),
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
