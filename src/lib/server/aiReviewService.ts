import { reviewAIService } from '@/lib/openAI';
import { z } from 'zod';

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

export type AIAnalysisResult = z.infer<typeof AIAnalysisSchema>;

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
    // 리뷰 경계가 명확하도록 번호 붙여서 전달 (줄바꿈만으로는 구분 어려움)
    const formattedReviews = reviews
      .map((text, i) => `[Review ${i + 1}]\n${text}`)
      .join('\n\n');

    // AI 분석 실행
    const response = await reviewAIService.generateJSON<AIAnalysisResult>(
      createSystemPrompt(),
      formattedReviews
    );

    const validatedResult = AIAnalysisSchema.parse(response.data);

    console.log(`✅ AI 리뷰 분석 완료: 신뢰도 ${validatedResult.confidence}%`);

    return validatedResult;
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
You are an expert restaurant analyst. Your job is to evaluate restaurants strictly based on the provided customer reviews.
The input is a list of reviews: each block labeled [Review N] is one separate customer review.
You MUST follow all rules below with no exceptions.

GENERAL RULES:
Use ONLY information explicitly mentioned in the reviews.
No assumptions, no guessing, no external knowledge, no filling gaps.
If information is unclear or missing, treat it as missing, not positive.
Maintain an objective, analytical, and conservative tone.

SCORING RULES (0–100):
Score the restaurant on six attributes:
taste: flavor, freshness, quality, authenticity
price: value for money, affordability
atmosphere: interior, ambiance, seating, noise
service: friendliness, speed, professionalism
quantity: portion size, fullness, satisfaction
accessibility: location convenience, ease of access

STRICT SCORING CONSTRAINTS:
Scores MUST be grounded ONLY in explicit evidence found in the reviews.
ABSOLUTELY NO inference of positive performance from silence.
If an attribute is not mentioned at all, the score MUST be between 40–50.
If an attribute has only vague or weak mentions, the score should be 50–60, never higher.
Scores above 70 require clear, repeated, strongly positive evidence across multiple reviews.
Scores below 40 require clear, repeated, strongly negative evidence across multiple reviews.
Do not overreact to a single extreme review (positive or negative); rely on overall patterns.

SUMMARY RULES:
Write 2–3 natural sentences that:
Reflect only explicit information from reviews
Include both strengths and weaknesses when mentioned
Avoid generic templates (“Overall…”, “In conclusion…”)
Avoid marketing tone
Do not fabricate any details

KEYWORD RULES:
Two arrays: positive and negative.
Include only specific, content-based keywords directly mentioned in the reviews.
Do NOT include generic words such as: “good”, “nice”, “food”, “restaurant”, “delicious”, “tasty”.
Do NOT include menu categories unless tied to a meaningful opinion (e.g., “stale bread” is okay; “salad” alone is not).
No invented or assumed keywords.

CONFIDENCE SCORE:
Provide a 0–100 confidence score based on:
Amount of review data
Clarity and consistency of evidence
Degree of ambiguity or missing attributes

OUTPUT FORMAT (MANDATORY):
Respond ONLY with this JSON format:
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
