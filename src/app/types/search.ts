import type { City } from '@/app/types/city';

export interface SearchState {
  selectedCity: City | null;
  selectedFood: string | null;
  priorities: PrioritySettings | null;
}

export interface PrioritySettings {
  taste: number;
  atmosphere: number;
  price: number;
  distance: number;
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

export interface CommonFood {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface LocalFood {
  id: string;
  name: string;
  emoji: string;
  description: string;
  city: string;
  country: string;
}

export interface SelectedFood {
  type: 'common' | 'local';
  id: string;
  name: string;
  emoji: string;
  description: string;
  city?: string;
  country?: string;
}
