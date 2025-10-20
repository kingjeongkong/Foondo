/**
 * 검색 관련 타입 정의
 */

export interface City {
  id: string;
  name: string;
  country: string;
}

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
