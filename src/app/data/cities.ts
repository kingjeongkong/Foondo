/**
 * 도시 데이터 (임시 하드코딩)
 * 나중에 API로 대체 예정
 */
import type { City } from '@/app/types/search';

export const CITIES: City[] = [
  { id: 'seoul', name: 'Seoul', country: 'South Korea' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan' },
  { id: 'paris', name: 'Paris', country: 'France' },
  { id: 'london', name: 'London', country: 'United Kingdom' },
  { id: 'newyork', name: 'New York', country: 'United States' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore' },
  { id: 'sydney', name: 'Sydney', country: 'Australia' },
];
