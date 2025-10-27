import { foodService } from '@/app/services/foodService';
import { City } from '@/app/types/city';
import { useQuery } from '@tanstack/react-query';

export function useFood(city: City | null, enabled: boolean) {
  const { data: localFoods, isLoading: isLoadingFoods } = useQuery({
    queryKey: ['foods', city?.id],
    queryFn: () => foodService().getFoods(city!),
    enabled: !!city && enabled,
    throwOnError: true,
  });

  return {
    localFoods: localFoods?.data ?? [],
    isLoadingFoods,
  };
}
