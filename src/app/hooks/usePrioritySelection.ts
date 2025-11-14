'use client';

import type {
  PriorityItem,
  PrioritySelectionState,
  PrioritySettings,
  SelectedPriority,
} from '@/app/types/search';
import { useCallback, useState } from 'react';

/**
 * 우선순위 선택을 위한 커스텀 훅
 * @param initialItems - 초기 우선순위 항목 리스트
 */
export function usePrioritySelection(initialItems: PriorityItem[]) {
  const [state, setState] = useState<PrioritySelectionState>({
    available: initialItems,
    selected: [],
  });

  // 항목 선택 (탭으로 선택)
  const selectPriority = useCallback(
    (item: PriorityItem) => {
      if (state.selected.length >= 3) return; // 3개 선택 완료 시 제한

      setState((prev) => {
        // 현재 사용 중인 순위들 찾기
        const usedRanks = prev.selected.map((s) => s.rank);

        // 비어있는 순위 중 가장 앞의 순위 찾기
        let emptyRank: 1 | 2 | 3;
        if (!usedRanks.includes(1)) {
          emptyRank = 1;
        } else if (!usedRanks.includes(2)) {
          emptyRank = 2;
        } else {
          emptyRank = 3;
        }

        const newSelected: SelectedPriority = { rank: emptyRank, item };

        return {
          ...prev,
          available: prev.available.filter((i) => i.id !== item.id),
          selected: [...prev.selected, newSelected],
        };
      });
    },
    [state.selected.length]
  );

  // 항목 해제 (탭으로 해제)
  const deselectPriority = useCallback(
    (rank: 1 | 2 | 3) => {
      const targetItem = state.selected.find((s) => s.rank === rank);
      if (!targetItem) return;

      setState((prev) => ({
        ...prev,
        available: [...prev.available, targetItem.item],
        selected: prev.selected.filter((s) => s.rank !== rank),
      }));
    },
    [state.selected]
  );

  // 선택 완료 여부
  const isComplete = state.selected.length === 3;

  // 선택된 우선순위를 PrioritySettings 형태로 변환
  const getPrioritySettings = useCallback((): PrioritySettings => {
    const settings: PrioritySettings = {
      taste: 0,
      atmosphere: 0,
      price: 0,
      accessibility: 0,
      service: 0,
      quantity: 0,
    };

    // 선택된 항목에 순위별 가중치 부여
    state.selected.forEach(({ rank, item }) => {
      const weight = rank === 1 ? 3 : rank === 2 ? 2 : 1;
      if (item.id in settings) {
        settings[item.id as keyof PrioritySettings] = weight;
      }
    });

    return settings;
  }, [state.selected]);

  return {
    state,
    selectPriority,
    deselectPriority,
    isComplete,
    getPrioritySettings,
  };
}
