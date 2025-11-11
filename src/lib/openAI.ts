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
      const response = await this.client.responses.create({
        model: this.config.model!,
        instructions: systemPrompt,
        input: userPrompt,
        temperature: this.config.temperature,
      });

      const output = response.output_text as string | undefined;
      if (!output) {
        throw new Error('No content generated');
      }

      const jsonData = JSON.parse(output);

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
