/**
 * 음식 데이터 (Mock Data)
 * 나중에 API로 대체 예정
 */
import type { CommonFood, LocalFood } from '@/app/types/search';

export const COMMON_FOODS: CommonFood[] = [
  {
    id: 'hamburger',
    name: 'Hamburger',
    emoji: '🍔',
    description: 'Classic American burger with beef patty',
  },
  {
    id: 'pizza',
    name: 'Pizza',
    emoji: '🍕',
    description: 'Italian flatbread with various toppings',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    emoji: '☕',
    description: 'Brewed coffee and espresso drinks',
  },
  {
    id: 'bar',
    name: 'Bar & Drinks',
    emoji: '🍺',
    description: 'Alcoholic beverages and cocktails',
  },
  {
    id: 'dessert',
    name: 'Dessert',
    emoji: '🍰',
    description: 'Sweet treats and pastries',
  },
  {
    id: 'healthy',
    name: 'Healthy',
    emoji: '🥗',
    description: 'Fresh salads and healthy options',
  },
  {
    id: 'sushi',
    name: 'Sushi',
    emoji: '🍣',
    description: 'Raw fish on rice',
  },
  {
    id: 'pasta',
    name: 'Pasta',
    emoji: '🍝',
    description: 'Italian noodles with sauce',
  },
];

export const LOCAL_FOODS: LocalFood[] = [
  {
    id: 'kimchi',
    name: 'Kimchi',
    emoji: '🥬',
    description: 'Fermented vegetables',
    city: 'Seoul',
    country: 'South Korea',
  },
  {
    id: 'bulgogi',
    name: 'Bulgogi',
    emoji: '🥩',
    description: 'Grilled marinated beef',
    city: 'Seoul',
    country: 'South Korea',
  },
  {
    id: 'bibimbap',
    name: 'Bibimbap',
    emoji: '🍚',
    description: 'Mixed rice bowl with vegetables',
    city: 'Seoul',
    country: 'South Korea',
  },
  {
    id: 'korean-bbq',
    name: 'Korean BBQ',
    emoji: '🔥',
    description: 'Grilled meat at the table',
    city: 'Seoul',
    country: 'South Korea',
  },
  {
    id: 'jajangmyeon',
    name: 'Jajangmyeon',
    emoji: '🍜',
    description: 'Black bean noodles',
    city: 'Seoul',
    country: 'South Korea',
  },
  {
    id: 'ramen',
    name: 'Ramen',
    emoji: '🍜',
    description: 'Japanese noodle soup',
    city: 'Tokyo',
    country: 'Japan',
  },
  {
    id: 'tempura',
    name: 'Tempura',
    emoji: '🍤',
    description: 'Deep-fried seafood and vegetables',
    city: 'Tokyo',
    country: 'Japan',
  },
  {
    id: 'croissant',
    name: 'Croissant',
    emoji: '🥐',
    description: 'Buttery French pastry',
    city: 'Paris',
    country: 'France',
  },
];
