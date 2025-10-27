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
  async generateJSON<T>(prompt: string): Promise<OpenAIResponse<T>> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content:
              'You are a highly intelligent API that strictly returns data in valid JSON format. Do not include any explanatory text, markdown formatting like ```json, or anything outside of the requested JSON structure.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      const jsonData = JSON.parse(content);

      return {
        data: jsonData,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('AI JSON 생성 실패:', error);
      throw new Error('Failed to generate JSON response');
    }
  }

  /**
   * 재시도 로직이 포함된 JSON 생성
   * @param prompt 프롬프트
   * @param maxRetries 최대 재시도 횟수
   * @returns 파싱된 JSON 데이터
   */
  async generateJSONWithRetry<T>(
    prompt: string,
    maxRetries: number = 3
  ): Promise<OpenAIResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateJSON<T>(prompt);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // 1초 대기 후 재시도
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw lastError!;
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
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
});

/**
 * 리뷰 분석용 AI 서비스 인스턴스 (gpt-4o)
 * 애플리케이션 전체에서 단 하나만 생성되어 재사용됩니다.
 */
export const reviewAIService = new OpenAIService({
  apiKey,
  model: 'gpt-4o-mini',
  temperature: 0.3, // 더 정확한 분석을 위해 낮은 temperature
  maxTokens: 5000, // 더 긴 응답을 위해 높은 토큰 수
});
