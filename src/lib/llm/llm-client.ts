import 'server-only';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider: 'openai' | 'deepseek' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMClient {
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    // Set initial config with defaults
    this.config = {
      provider: 'deepseek',
      maxTokens: 500,
      temperature: 0.7,
      ...config,
    };
    
    // Override with environment variables if available
    if (process.env.LLM_PROVIDER) {
      this.config.provider = process.env.LLM_PROVIDER as any;
    }
    if (process.env.LLM_API_KEY) {
      this.config.apiKey = process.env.LLM_API_KEY;
    }
    if (process.env.LLM_MAX_TOKENS) {
      this.config.maxTokens = parseInt(process.env.LLM_MAX_TOKENS);
    }
    if (process.env.LLM_TEMPERATURE) {
      this.config.temperature = parseFloat(process.env.LLM_TEMPERATURE);
    }
    
    // Set API URL and model based on provider
    if (!this.config.apiUrl) {
      this.config.apiUrl = process.env.LLM_API_URL || this.getDefaultApiUrl();
    }
    if (!this.config.model) {
      this.config.model = process.env.LLM_MODEL || this.getDefaultModel();
    }
  }

  private getDefaultApiUrl(): string {
    const provider = this.config.provider || 'deepseek';
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions';
      default:
        return process.env.LLM_API_URL || 'http://localhost:8080/v1/chat/completions';
    }
  }

  private getDefaultModel(): string {
    const provider = this.config.provider || 'deepseek';
    switch (provider) {
      case 'openai':
        return 'gpt-3.5-turbo';
      case 'deepseek':
        return 'deepseek-chat';
      default:
        return 'default-model';
    }
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    // For custom provider with mock mode, return intelligent mock responses
    if (this.config.provider === 'custom' && this.config.apiKey === 'mock-key') {
      return this.generateMockResponse(messages);
    }

    if (!this.config.apiKey && this.config.provider !== 'custom') {
      throw new Error(`API key required for ${this.config.provider} provider`);
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.apiUrl!, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('LLM chat error:', error);
      throw error;
    }
  }

  private generateMockResponse(messages: LLMMessage[]): LLMResponse {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const userInput = lastUserMessage?.content || '';
    const lowerInput = userInput.toLowerCase();

    // Generate contextual responses based on input
    let response = '';
    
    if (lowerInput.includes('你好') || lowerInput.includes('hello') || lowerInput.includes('hi')) {
      const greetings = [
        '你好！很高兴见到你 😊 有什么我可以帮助你的吗？',
        '嗨！今天过得怎么样？',
        '你好呀！我是你的AI助手，随时为你服务！',
      ];
      response = greetings[Math.floor(Math.random() * greetings.length)];
    } else if (lowerInput.includes('天气')) {
      response = '今天天气看起来不错呢！记得适时增减衣物，保持健康哦～';
    } else if (lowerInput.includes('怎么样') || lowerInput.includes('如何')) {
      response = '这是个很好的问题！让我想想...我觉得这取决于具体情况。你能告诉我更多细节吗？';
    } else if (lowerInput.includes('谢谢')) {
      response = '不客气！能帮到你我很开心 😊';
    } else if (lowerInput.includes('再见') || lowerInput.includes('bye')) {
      response = '再见！期待下次聊天，祝你有美好的一天！👋';
    } else if (lowerInput.includes('吃') || lowerInput.includes('饭')) {
      response = '说到吃的，我虽然不能品尝美食，但我知道美食能带来幸福感！你最喜欢什么菜呢？';
    } else if (lowerInput.includes('工作') || lowerInput.includes('忙')) {
      response = '工作虽然重要，但也要记得劳逸结合哦！适当的休息能让你更有效率。';
    } else {
      // Default intelligent responses
      const defaults = [
        '嗯，我明白你的意思。这确实是个值得思考的话题。',
        '有意思！你能详细说说吗？我很想了解更多。',
        '我觉得你说得很有道理。从另一个角度看...',
        '这让我想起了一句话："生活就像一盒巧克力，你永远不知道下一颗是什么味道。"',
        '确实如此！每个人都有自己独特的见解和体验。',
      ];
      response = defaults[Math.floor(Math.random() * defaults.length)];
    }

    return {
      content: response,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }

  async generateResponse(
    userMessage: string,
    systemPrompt?: string,
    history?: LLMMessage[]
  ): Promise<string> {
    const messages: LLMMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    if (history) {
      messages.push(...history);
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    const response = await this.chat(messages);
    return response.content;
  }
}

// Simple response cache to avoid repeated API calls
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export function getCachedResponse(key: string): string | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  responseCache.delete(key);
  return null;
}

export function setCachedResponse(key: string, response: string): void {
  // Limit cache size
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, { response, timestamp: Date.now() });
}

export default LLMClient;