/**
 * 음식 데이터 (Mock Data)
 * 나중에 API로 대체 예정
 */
import type { Food } from '@/app/types/food';

export const COMMON_FOODS: Food[] = [
  {
    id: 1,
    cityId: '1',
    name: 'Hamburger',
    description: 'Classic American burger with beef patty',
    createdAt: new Date(),
  },
  {
    id: 2,
    cityId: '1',
    name: 'Pizza',
    description: 'Italian flatbread with various toppings',
    createdAt: new Date(),
  },
  {
    id: 3,
    cityId: '1',
    name: 'Coffee',
    description: 'Brewed coffee and espresso drinks',
    createdAt: new Date(),
  },
  {
    id: 4,
    cityId: '1',
    name: 'Bar & Drinks',
    description: 'Alcoholic beverages and cocktails',
    createdAt: new Date(),
  },
  {
    id: 5,
    cityId: '1',
    name: 'Dessert',
    description: 'Sweet treats and pastries',
    createdAt: new Date(),
  },
  {
    id: 6,
    cityId: '1',
    name: 'Healthying',
    description: 'Fresh salads and healthy options',
    createdAt: new Date(),
  },
];

export const LOCAL_FOODS: Food[] = [
  {
    id: 7,
    cityId: '1',
    name: 'Kimchi',
    description: 'Fermented vegetables',
    createdAt: new Date(),
  },
  {
    id: 8,
    cityId: '1',
    name: 'Bulgogi',
    description: 'Grilled marinated beef',
    createdAt: new Date(),
  },
  {
    id: 9,
    cityId: '1',
    name: 'Korean BBQ',
    description: 'Grilled meat at the table',
    createdAt: new Date(),
  },
  {
    id: 10,
    cityId: '1',
    name: 'Jajangmyeon',
    description: 'Black bean noodles',
    createdAt: new Date(),
  },
  {
    id: 11,
    cityId: '1',
    name: 'Ramen',
    description: 'Japanese noodle soup',
    createdAt: new Date(),
  },
  {
    id: 12,
    cityId: '1',
    name: 'Tempura',
    description: 'Deep-fried seafood and vegetables',
    createdAt: new Date(),
  },
  {
    id: 13,
    cityId: '1',
    name: 'Croissant',
    description: 'Buttery French pastry',
    createdAt: new Date(),
  },
];
