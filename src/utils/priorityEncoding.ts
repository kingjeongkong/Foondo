import type { PrioritySettings } from '@/app/types/search';

// URL용 우선순위 키 순서 (고정)
const PRIORITY_KEYS: (keyof PrioritySettings)[] = [
  'taste',
  'atmosphere',
  'price',
  'accessibility',
  'service',
  'quantity',
];

/**
 * PrioritySettings를 6자리 문자열로 인코딩 (예: "123000")
 * 각 자리는 taste, atmosphere, price, accessibility, service, quantity 순서의 rank(0~3)
 */
export function encodePrioritySettings(
  priorities: PrioritySettings
): string {
  return PRIORITY_KEYS.map((key) => {
    const value = priorities[key] ?? 0;
    if (value < 0 || value > 3) {
      return '0';
    }
    return String(value);
  }).join('');
}

/**
 * 6자리 문자열을 PrioritySettings로 디코딩
 * 형식이 맞지 않으면 null 반환
 */
export function decodePrioritySettings(
  code: string | null | undefined
): PrioritySettings | null {
  if (!code || code.length !== PRIORITY_KEYS.length) {
    return null;
  }

  const values = code.split('');
  const priorities: PrioritySettings = {
    taste: 0,
    atmosphere: 0,
    price: 0,
    accessibility: 0,
    service: 0,
    quantity: 0,
  };

  values.forEach((char, index) => {
    const rank = Number(char);
    if (Number.isNaN(rank) || rank < 0 || rank > 3) {
      return;
    }
    const key = PRIORITY_KEYS[index];
    priorities[key] = rank as 0 | 1 | 2 | 3;
  });

  return priorities;
}
