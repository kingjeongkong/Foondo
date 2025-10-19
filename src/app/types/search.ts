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
