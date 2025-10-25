import { useQuery } from '@tanstack/react-query';
import { foodService } from '../services/foodService';

export function useFood(cityId: string) {
  const { data: localFoods, isLoading: isLoadingFoods } = useQuery({
    queryKey: ['foods', cityId],
    queryFn: () => foodService().getFoods(cityId),
    enabled: !!cityId,
    throwOnError: true,
  });

  return {
    localFoods: localFoods?.data ?? [],
    isLoadingFoods,
  };
}
