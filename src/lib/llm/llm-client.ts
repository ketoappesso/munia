import 'server-only';
import prisma from '@/lib/prisma/prisma';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider: 'openai' | 'deepseek' | 'claude' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  userId?: string; // Add userId to load user-specific config
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
      topP: 0.9,
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

  // Load user-specific configuration from database
  async loadUserConfig(userId: string) {
    try {
      const aiProfile = await prisma.aIProfile.findUnique({
        where: { userId },
      });

      if (aiProfile) {
        this.config.provider = aiProfile.llmProvider as any;
        this.config.model = aiProfile.llmModel;
        this.config.temperature = aiProfile.temperature;
        this.config.maxTokens = aiProfile.maxTokens;
        this.config.topP = aiProfile.topP;
        
        // Update API URL based on provider
        this.config.apiUrl = this.getDefaultApiUrl();
        
        // Set API key from environment based on provider
        switch (aiProfile.llmProvider) {
          case 'openai':
            this.config.apiKey = process.env.OPENAI_API_KEY;
            break;
          case 'deepseek':
            this.config.apiKey = process.env.DEEPSEEK_API_KEY || process.env.LLM_API_KEY;
            break;
          case 'claude':
            this.config.apiKey = process.env.CLAUDE_API_KEY;
            break;
        }
      }
    } catch (error) {
      console.error('Error loading user AI config:', error);
    }
  }

  private getDefaultApiUrl(): string {
    const provider = this.config.provider || 'deepseek';
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions';
      case 'claude':
        return 'https://api.anthropic.com/v1/messages';
      default:
        return process.env.LLM_API_URL || 'http://localhost:8080/v1/chat/completions';
    }
  }

  private getDefaultModel(): string {
    const provider = this.config.provider || 'deepseek';
    switch (provider) {
      case 'openai':
        return 'gpt-4-turbo-preview';
      case 'deepseek':
        return 'deepseek-chat';
      case 'claude':
        return 'claude-3-opus-20240229';
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
      // Handle Claude API differently
      if (this.config.provider === 'claude') {
        return this.chatWithClaude(messages);
      }

      // OpenAI-compatible format (OpenAI, DeepSeek, etc.)
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
          top_p: this.config.topP,
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

  private async chatWithClaude(messages: LLMMessage[]): Promise<LLMResponse> {
    // Convert messages to Claude format
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey!,
      'anthropic-version': '2023-06-01',
    };

    const response = await fetch(this.config.apiUrl!, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model,
        messages: nonSystemMessages,
        system: systemMessage?.content,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
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
    history?: LLMMessage[],
    userId?: string
  ): Promise<string> {
    const messages: LLMMessage[] = [];

    // Load user configuration if userId is provided
    if (userId) {
      await this.loadUserConfig(userId);
      
      // Get user's AI profile for custom prompts
      const aiProfile = await prisma.aIProfile.findUnique({
        where: { userId },
      });
      
      // Use custom system prompt if available
      if (aiProfile?.systemPrompt) {
        systemPrompt = aiProfile.systemPrompt;
      }
    }

    // Add system prompt with injected memories
    if (systemPrompt) {
      let enhancedPrompt = systemPrompt;
      
      // Inject user memories if available
      if (userId) {
        const memories = await this.getUserMemories(userId);
        if (memories.length > 0) {
          enhancedPrompt += '\n\n## User Context:\n' + memories.join('\n');
        }
      }
      
      messages.push({
        role: 'system',
        content: enhancedPrompt,
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

  private async getUserMemories(userId: string, limit: number = 10): Promise<string[]> {
    try {
      // Fetch high-priority memories for the user
      const memories = await prisma.aIMemory.findMany({
        where: {
          userId,
          OR: [
            { type: 'long_term' },
            {
              type: 'short_term',
              expiresAt: {
                gte: new Date(),
              },
            },
          ],
        },
        orderBy: [
          { score: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: limit,
      });

      return memories.map(m => `- [${m.category}] ${m.title}: ${m.content}`);
    } catch (error) {
      console.error('Error fetching user memories:', error);
      return [];
    }
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