import type { City } from '@/app/types/city';
import type { Food } from '@/app/types/food';

export interface SearchState {
  selectedCity: City | null;
  selectedFood: Food | null;
  priorities: PrioritySettings | null;
}

export interface PrioritySettings {
  taste: number;
  atmosphere: number;
  price: number;
  accessibility: number;
  service: number;
  quantity: number;
}

// 우선순위 항목 타입
export interface PriorityItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

// 선택된 우선순위 (1, 2, 3순위)
export interface SelectedPriority {
  rank: 1 | 2 | 3;
  item: PriorityItem;
}

// 우선순위 선택 상태
export interface PrioritySelectionState {
  available: PriorityItem[];
  selected: SelectedPriority[];
}
