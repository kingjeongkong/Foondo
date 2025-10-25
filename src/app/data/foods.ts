/**
 * 음식 데이터 (Mock Data)
 * 나중에 API로 대체 예정
 */
import type { Food } from '@/app/types/food';

export const COMMON_FOODS: Food[] = [
  {
    id: '1',
    cityId: '1',
    name: 'Hamburger',
    description: 'Classic American burger with beef patty',
    createdAt: new Date(),
  },
  {
    id: '2',
    cityId: '1',
    name: 'Pizza',
    description: 'Italian flatbread with various toppings',
    createdAt: new Date(),
  },
  {
    id: '3',
    cityId: '1',
    name: 'Coffee',
    description: 'Brewed coffee and espresso drinks',
    createdAt: new Date(),
  },
  {
    id: '4',
    cityId: '1',
    name: 'Bar & Drinks',
    description: 'Alcoholic beverages and cocktails',
    createdAt: new Date(),
  },
  {
    id: '5',
    cityId: '1',
    name: 'Dessert',
    description: 'Sweet treats and pastries',
    createdAt: new Date(),
  },
  {
    id: '6',
    cityId: '1',
    name: 'Healthying',
    description: 'Fresh salads and healthy options',
    createdAt: new Date(),
  },
];
