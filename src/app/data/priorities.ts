/**
 * 우선순위 데이터 (6개 항목)
 * 맛, 가격, 분위기, 서비스, 양, 접근성
 */
import type { PriorityItem } from '@/app/types/search';

export const PRIORITY_ITEMS: PriorityItem[] = [
  {
    id: 'taste',
    name: 'Taste',
    emoji: '👅',
    description: '맛의 품질과 풍미',
    color: 'warm-taste',
  },
  {
    id: 'price',
    name: 'Price',
    emoji: '💰',
    description: '가격 대비 가치',
    color: 'fresh-taste',
  },
  {
    id: 'atmosphere',
    name: 'Atmosphere',
    emoji: '🌟',
    description: '분위기와 인테리어',
    color: 'rich-taste',
  },
  {
    id: 'service',
    name: 'Service',
    emoji: '🤝',
    description: '서비스 품질',
    color: 'sweet-taste',
  },
  {
    id: 'quantity',
    name: 'Quantity',
    emoji: '🍽️',
    description: '음식의 양과 포만감',
    color: 'ai-purple',
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    emoji: '🚶',
    description: '접근성과 위치',
    color: 'neutral-warm',
  },
];
