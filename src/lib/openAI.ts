import OpenAI from 'openai';

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenAIResponse<T = string> {
  data: T;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 5000,
      ...config,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * JSON 형식 응답 생성
   * @param prompt 프롬프트
   * @returns 파싱된 JSON 데이터
   */
  async generateJSON<T>(
    systemPrompt: string,
    userPrompt: string
  ): Promise<OpenAIResponse<T>> {
    try {
      const response = await this.client.responses.create(
        {
          model: this.config.model!,
          instructions: systemPrompt,
          input: userPrompt,
          temperature: this.config.temperature,
        },
        { maxRetries: 1 }
      );

      const output = response.output_text as string | undefined;
      if (!output) {
        throw new Error('No content generated');
      }

      // 마크다운 코드 블록 제거
      const cleanedOutput = removeMarkdownCodeBlocks(output);
      const jsonData = JSON.parse(cleanedOutput);

      return {
        data: jsonData,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('AI JSON 생성 실패:', error);
      throw new Error('Failed to generate JSON response');
    }
  }
}

// API 키 검증
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

/**
 * 음식 생성용 AI 서비스 인스턴스 (gpt-4o-mini)
 * 애플리케이션 전체에서 단 하나만 생성되어 재사용됩니다.
 */
export const foodAIService = new OpenAIService({
  apiKey,
  model: 'gpt-4o',
  temperature: 0.1,
  maxTokens: 1000,
});

/**
 * 리뷰 분석용 AI 서비스 인스턴스 (gpt-4o)
 * 애플리케이션 전체에서 단 하나만 생성되어 재사용됩니다.
 */
export const reviewAIService = new OpenAIService({
  apiKey,
  model: 'gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 5000,
});

/**
 * 마크다운 코드 블록을 제거하고 순수 JSON 문자열을 반환합니다.
 * @param text 마크다운이 포함될 수 있는 텍스트
 * @returns 마크다운 코드 블록이 제거된 텍스트
 */
function removeMarkdownCodeBlocks(text: string): string {
  let cleaned = text.trim();

  // ```json 또는 ```로 시작하는 경우 제거
  if (cleaned.startsWith('```')) {
    // 첫 번째 줄 제거 (```json 또는 ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    // 마지막 ``` 제거
    cleaned = cleaned.replace(/\n?```\s*$/, '');
  }

  // 앞뒤 공백 및 줄바꿈 제거
  cleaned = cleaned.trim();

  // JSON 객체 부분만 추출 (앞뒤에 불필요한 텍스트가 있는 경우)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return cleaned;
}
