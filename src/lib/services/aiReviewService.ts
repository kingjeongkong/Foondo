import { reviewAIService } from '@/lib/openAI';
import { z } from 'zod';

// AI 분석 결과 타입 정의
export interface AIAnalysisResult {
  scores: {
    taste: number; // 맛의 품질과 풍미 (0-100)
    price: number; // 가격 대비 가치 (0-100)
    atmosphere: number; // 분위기와 인테리어 (0-100)
    service: number; // 서비스 품질 (0-100)
    quantity: number; // 음식의 양과 포만감 (0-100)
    accessibility: number; // 접근성과 위치 (0-100)
  };
  summary: string; // AI 한 줄 요약
  keywords: {
    positive: string[]; // 긍정 키워드
    negative: string[]; // 부정 키워드
  };
  confidence: number; // 분석 신뢰도 (0-100)
}

// AI 응답 검증을 위한 Zod 스키마
const AIAnalysisSchema = z.object({
  scores: z.object({
    taste: z.number().min(0).max(100),
    price: z.number().min(0).max(100),
    atmosphere: z.number().min(0).max(100),
    service: z.number().min(0).max(100),
    quantity: z.number().min(0).max(100),
    accessibility: z.number().min(0).max(100),
  }),
  summary: z.string(),
  keywords: z.object({
    positive: z.array(z.string()),
    negative: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(100),
});

/**
 * 리뷰 텍스트를 분석하여 6가지 요소에 대한 객관적인 점수를 생성합니다.
 * @param reviews 리뷰 텍스트 배열
 * @param options 분석 옵션
 * @returns AI 분석 결과
 */
export async function analyzeReviewsWithAI(
  reviews: string[]
): Promise<AIAnalysisResult> {
  if (!reviews || reviews.length === 0) {
    throw new Error('리뷰 데이터가 없습니다');
  }

  console.log(
    `🤖 AI 리뷰 분석 시작: ${reviews.length}개 리뷰, 총 ${reviews.join(' ').length}자`
  );

  try {
    // AI 분석 실행
    const response = await reviewAIService.generateJSON<AIAnalysisResult>(
      createSystemPrompt(),
      reviews.join('\n\n')
    );

    // 응답 검증 및 후처리
    const validatedResult = validateAndProcessResult(response.data);

    console.log(`✅ AI 리뷰 분석 완료: 신뢰도 ${validatedResult.confidence}%`);

    return response.data as AIAnalysisResult;
  } catch (error) {
    console.error('AI 리뷰 분석 실패:', error);
    throw new Error('리뷰 분석에 실패했습니다');
  }
}

/**
 * AI 분석을 위한 프롬프트를 생성합니다.
 */
function createSystemPrompt(): string {
  return `
You are an expert restaurant analyst. Analyze the following customer reviews and provide objective, unbiased scores for 6 key restaurant attributes.

TASK:
Rate each attribute on a scale of 0-100 based on the review content. Be objective, analytical, and unbiased. Do not overreact to single extreme reviews - consider the overall sentiment and patterns across all reviews.

ATTRIBUTES TO SCORE:
1. taste (0-100): Food quality, flavor, authenticity
2. price (0-100): Value for money, affordability
3. atmosphere (0-100): Ambiance, interior, environment
4. service (0-100): Staff quality, responsiveness, friendliness
5. quantity (0-100): Portion size, satisfaction level
6. accessibility (0-100): Location convenience, ease of access

INSTRUCTIONS:
- Analyze patterns across ALL reviews, not individual extreme opinions
- Be conservative and objective in scoring
- Consider both positive and negative mentions
- Provide a concise summary highlighting key strengths and weaknesses
- Extract meaningful, content-specific keywords (avoid generic words like "good", "food", "restaurant").
- Assess your confidence in the analysis (0-100)

OUTPUT FORMAT (JSON only, no other text):
{
  "scores": {
    "taste": number,
    "price": number,
    "atmosphere": number,
    "service": number,
    "quantity": number,
    "accessibility": number
  },
  "summary": string,
  "keywords": {
    "positive": string[],
    "negative": string[]
  },
  "confidence": number
}

All outputs must be in English.
`;
}

/**
 * AI 응답을 검증하고 후처리합니다.
 */
function validateAndProcessResult(data: AIAnalysisResult): AIAnalysisResult {
  try {
    // Zod 스키마로 검증
    const validated = AIAnalysisSchema.parse(data);

    // 점수 범위 클램핑 및 소수점 처리
    const processedScores = Object.fromEntries(
      Object.entries(validated.scores).map(([key, value]) => [
        key,
        Math.max(0, Math.min(100, Math.round(value * 10) / 10)), // 소수점 1자리
      ])
    ) as AIAnalysisResult['scores'];

    // 신뢰도 클램핑
    const processedConfidence = Math.max(
      0,
      Math.min(100, Math.round(validated.confidence))
    );

    return {
      scores: processedScores,
      summary: validated.summary.trim(),
      keywords: {
        positive: validated.keywords.positive.slice(0, 10),
        negative: validated.keywords.negative.slice(0, 10),
      },
      confidence: processedConfidence,
    };
  } catch (error) {
    console.error('AI 응답 검증 실패:', error);

    // 검증 실패 시 기본값 반환
    return {
      scores: {
        taste: 50,
        price: 50,
        atmosphere: 50,
        service: 50,
        quantity: 50,
        accessibility: 50,
      },
      summary: 'Analysis failed - using default scores',
      keywords: {
        positive: [],
        negative: [],
      },
      confidence: 0,
    };
  }
}

/**
 * 테스트용 샘플 리뷰 데이터를 생성합니다.
 */
export function getSampleReviews(): string[] {
  return [
    "My fiancée and I come to Bournemouth once a year and without fail visit this place. The food is delicious, great portion sizes and staff are always friendly. We've tried a few fish and chips shops during our time and this is by far the best in Bournemouth",

    "Simply outstanding.\n\nService was very friendly, sauces were complimentary, the servings were HUGE and the taste amazing!\n\nI'm a big fish and chips fan, and this is the best I've ever had, hands down, and the best value, too!\n\nThanks you guys!",

    "Overpriced below average fish and chip shop. Very small portion of chips classed as a 'regular' and the mayonnaise sachet's are 2 months out of date!!! (We went 13th August) We will never go there again.",

    "We are a group of Volkswagen employees, and we stopped by Seastar Fish & Chips after a long workday. The food was absolutely fantastic — crispy fish, perfectly cooked chips, and everything fresh and flavorful. The staff were friendly, fast, and welcoming, making us feel right at home. One of the best traditional fish & chips experiences we've had in the UK. Highly recommended! 👏🇬🇧🐟🍟",

    'Nice traditional fish and chips and great service! Haddock was very good, despite the greasy look! Just chips that unfortunately were a bit soggy.',
  ];
}
