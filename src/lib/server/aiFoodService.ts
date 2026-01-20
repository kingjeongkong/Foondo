import type { City } from '@/app/types/city';
import type { CreateFoodRequest } from '@/app/types/food';
import { foodAIService } from '@/lib/openAI';
import { z } from 'zod';

// AI 응답을 검증하기 위한 Zod 스키마 정의
const AIGeneratedFoodSchema = z.object({
  foods: z.array(
    z.object({
      name: z.string().min(1, 'Food name cannot be empty.'),
      description: z.string().min(1, 'Food description cannot be empty.'),
      category: z.string().min(1, 'Food category cannot be empty.'),
    })
  ),
});

// 추천할 음식 개수를 상수로 관리
const FOOD_COUNT = 10;

/**
 * gpt-4o를 사용하여 특정 도시의 대표 음식 데이터를 생성하고 포맷합니다.
 * @param city 도시 정보 객체
 * @returns DB에 저장할 수 있는 음식 데이터 배열
 */
export async function generateAndFormatLocalFoods(
  city: City
): Promise<CreateFoodRequest[]> {
  const userPrompt = `Find local foods of ${city.name}, ${city.country}`;

  try {
    const response = await foodAIService.generateJSON<{
      foods: {
        name: string;
        description: string;
        category: string;
      }[];
    }>(createSystemPrompt(city), userPrompt);

    // AI 응답을 Zod로 안전하게 검증
    const validatedResponse = AIGeneratedFoodSchema.parse(response.data);

    // AI 응답을 Prisma가 요구하는 형식으로 변환(매핑)
    const formattedFoods: CreateFoodRequest[] = validatedResponse.foods.map(
      (food) => ({
        cityId: city.id,
        name: food.name,
        description: food.description,
        category: food.category,
      })
    );

    return formattedFoods;
  } catch (error) {
    console.error('AI 음식 생성 및 포맷팅 실패:', error);
    // 에러를 다시 던져서 API 라우트에서 최종 처리하도록 함
    throw new Error('AI로부터 유효한 음식 데이터를 생성하는 데 실패했습니다.');
  }
}

function createSystemPrompt(city: City): string {
  return `
  You are a travel food curator recommending authentic and diverse local dishes from specific cities.
  
  Recommend exactly ${FOOD_COUNT} must-try foods for a traveler visiting "${city.name}, ${city.country}".
  Include both iconic classics and hidden local favorites that truly represent this city's food culture and everyday local favorites that people commonly enjoy.
  
  For each food, provide:
  - name: The food name
  - description: 1–2 sentences explaining what it is and why it's special
  - category: A short, simple label describing what type of food it is (e.g., street food, main dish, dessert, snack, beverage, traditional, etc.)
    • The category should be concise (1–3 words max).
    • Avoid long phrases or sentences.
  
  Return your answer strictly in this JSON format:
  {
    "foods": [
      { "name": "food name", "description": "brief explanation", "category": "category name" },
      ...
    ]
  }
  
  Rules:
  - All content must be in English.
  - Do not include any text outside the JSON.
  - Each field (name, description, category) must be non-empty and specific to ${city.name}.
  `;
}
