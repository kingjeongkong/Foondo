import type { City, CreateCityRequest } from '@/app/types/city';
import type { Food } from '@/app/types/food';
import type { PrioritySettings } from '@/app/types/search';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { useCity, useCityFromCache } from './useCity';
import { useFoodFromCache } from './useFood';
import { useFunnel } from './useFunnel';

/**
 * 검색 플로우를 관리하는 훅
 * URL 동기화를 통해 step, cityId, foodId를 관리하고,
 * City/Food 선택 및 step navigation 로직을 제공합니다.
 */
export function useSearchFlow() {
  const router = useRouter();
  const { step, next, setStep } = useFunnel();

  // URL에 검색 조건 저장 (공유/북마크/복구 지원)
  const [cityId, setCityId] = useQueryState('cityId');
  const [foodId, setFoodId] = useQueryState('foodId');

  // URL에서 데이터 복원
  const selectedCity = useCityFromCache(cityId);
  // food step일 때만 localFoods 패칭 (COMMON_FOODS는 항상 사용 가능)
  const selectedFood = useFoodFromCache(
    cityId,
    foodId,
    ['food', 'priority', 'results'].includes(step)
  );

  // Priority는 URL에 저장하지 않음 (복잡한 객체이므로)
  const [selectedPriorities, setSelectedPriorities] =
    useState<PrioritySettings | null>(null);

  // City 관련 로직
  const { createOrGetCity, isCreatingCity, getCachedCity } = useCity();

  // City 선택 핸들러 (선택만 처리, API 호출은 handleNext에서)
  const handleCitySelect = (city: City) => {
    // URL에 cityId만 저장 (history: 'replace'로 같은 step 내에서의 선택 변경은 히스토리에 쌓지 않음)
    setCityId(city.id, { history: 'replace' });
  };

  // Food 선택 핸들러 (선택만 처리, next는 별도)
  const handleFoodSelect = (food: Food) => {
    // URL에 foodId 저장 (history: 'replace'로 같은 step 내에서의 선택 변경은 히스토리에 쌓지 않음)
    setFoodId(food.id, { history: 'replace' });
  };

  // 다음 단계로 이동 (유효성 검사 및 API 호출 포함)
  const handleNext = async () => {
    if (step === 'city') {
      // City가 선택되어 있는지 확인
      if (!selectedCity) {
        return;
      }

      // 캐시 확인 (이미 요청한 적이 있는 경우)
      const cachedCity = getCachedCity(selectedCity.id);
      if (cachedCity) {
        // 캐시에 있으면 바로 다음 단계로
        next();
        return;
      }

      // POST 요청 (서버에서 존재하면 반환, 없으면 생성)
      const requestData: CreateCityRequest = {
        id: selectedCity.id,
        name: selectedCity.name,
        country: selectedCity.country ?? '',
      };
      await createOrGetCity(requestData);

      // API 호출 완료 후 다음 단계로 이동
      next();
    } else if (step === 'food') {
      // Food가 선택된 경우에만 진행
      if (!selectedFood) {
        return;
      }
      next();
    }
  };

  // Priority 완료 핸들러
  const handlePriorityComplete = (priorities: PrioritySettings) => {
    setSelectedPriorities(priorities);
    next();
  };

  // 뒤로가기 핸들러
  // [규칙 3] 뒤로가기: 무조건 'router.back()' (POP)
  // setStep이나 router.replace를 쓰지 않습니다.
  // 물리적으로 스택을 한 칸 제거하여 이전 단계로 돌아갑니다.
  const handleBack = () => {
    // 브라우저 히스토리에서 현재 단계(Step)를 제거합니다.
    router.back();

    // 참고: URL이 이전 상태(이전 step과 이전 데이터)로 돌아가면,
    // nuqs가 자동으로 이를 감지하여 step, cityId, foodId 변수를 업데이트합니다.
    // 따라서 별도의 상태 초기화 코드가 필요 없습니다.
  };

  // 새 검색 시작
  const handleNewSearch = () => {
    // 새 검색은 완전히 새로운 맥락이므로 초기화
    setCityId(null, { history: 'replace' });
    setFoodId(null, { history: 'replace' });
    setSelectedPriorities(null);
    setStep('city');
  };

  return {
    step,
    data: {
      selectedCity,
      selectedFood,
      selectedPriorities,
      cityId,
      foodId,
    },
    handlers: {
      handleCitySelect,
      handleFoodSelect,
      handlePriorityComplete,
      handleNewSearch,
      handleNext,
      handleBack,
    },
    status: {
      isCreatingCity,
    },
  };
}
