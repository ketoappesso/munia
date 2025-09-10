import 'server-only';
import LLMClient, { LLMMessage, getCachedResponse, setCachedResponse } from './llm-client';
import prisma from '@/lib/prisma/prisma';
import { createVolcengineTTSClient } from '@/lib/volcengine/tts-client';

export interface PunkAIConfig {
  personality?: string;
  promptTemplate?: string;
  model?: string;
  maxHistoryMessages?: number;
}

export interface PunkAIResponse {
  text: string;
  audio?: string; // Base64 encoded audio
  voiceId?: string;
  cached?: boolean;
}

class PunkAIService {
  private llmClient: LLMClient;
  private ttsClient = createVolcengineTTSClient();

  constructor() {
    this.llmClient = new LLMClient();
  }

  /**
   * Check if a user is a punk user
   */
  async isPunkUser(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { punked: true },
    });
    return user?.punked || false;
  }

  /**
   * Get punk user's configuration
   */
  async getPunkUserConfig(userId: string): Promise<PunkAIConfig & { ttsVoiceId?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        punked: true,
        ttsVoiceId: true,
        name: true,
        bio: true,
      },
    });

    if (!user || !user.punked) {
      throw new Error('User is not a punk user');
    }

    // Default personality based on user profile
    const defaultPersonality = `你是${user.name || '一个智能助手'}。${user.bio || '你友好、专业、乐于助人。'}
你的回复简洁明了，富有个性。你会根据对话内容提供有价值的回应。`;

    return {
      personality: defaultPersonality,
      promptTemplate: '请以自然、友好的方式回复用户的消息。',
      model: process.env.LLM_MODEL,
      maxHistoryMessages: 10,
      ttsVoiceId: user.ttsVoiceId || undefined,
    };
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<LLMMessage[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        content: true,
        senderId: true,
      },
    });

    // Check which participant is the punk user
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        participant1Id: true,
        participant2Id: true,
        participant1: { select: { punked: true } },
        participant2: { select: { punked: true } },
      },
    });

    if (!conversation) return [];

    const punkUserId = conversation.participant1.punked 
      ? conversation.participant1Id 
      : conversation.participant2.punked 
      ? conversation.participant2Id 
      : null;

    if (!punkUserId) return [];

    // Convert messages to LLM format
    return messages.reverse().map(msg => ({
      role: msg.senderId === punkUserId ? 'assistant' : 'user',
      content: msg.content,
    } as LLMMessage));
  }

  /**
   * Generate AI response for a punk user
   */
  async generatePunkResponse(
    conversationId: string,
    userMessage: string,
    punkUserId: string
  ): Promise<PunkAIResponse> {
    try {
      // Check cache first
      const cacheKey = `punk_${punkUserId}_${userMessage.slice(0, 50)}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        console.log('Returning cached punk response');
        return { text: cached, cached: true };
      }

      // Get punk user config
      const config = await this.getPunkUserConfig(punkUserId);

      // Get conversation history
      const history = await this.getConversationHistory(conversationId, config.maxHistoryMessages);

      // Generate system prompt
      const systemPrompt = `${config.personality}

${config.promptTemplate}

重要规则：
1. 保持回复简洁，通常不超过100字
2. 使用自然的对话语气
3. 根据上下文提供相关回应
4. 可以使用表情符号增加亲和力`;

      // Generate AI response
      const aiResponse = await this.llmClient.generateResponse(
        userMessage,
        systemPrompt,
        history
      );

      // Cache the response
      setCachedResponse(cacheKey, aiResponse);

      // Generate TTS audio if voice is configured
      let audioBase64: string | undefined;
      if (config.ttsVoiceId && this.ttsClient.isConfigured()) {
        try {
          audioBase64 = await this.ttsClient.synthesizeToBase64({
            text: aiResponse,
            voiceType: config.ttsVoiceId,
            speed: 1.1,
            volume: 1.0,
            pitch: 1.0,
            encoding: 'mp3',
          });
        } catch (error) {
          console.error('Failed to generate TTS for punk response:', error);
        }
      }

      return {
        text: aiResponse,
        audio: audioBase64,
        voiceId: config.ttsVoiceId,
        cached: false,
      };
    } catch (error) {
      console.error('Error generating punk response:', error);
      
      // Fallback response
      const fallbackResponses = [
        '让我想想...这个问题很有意思！',
        '嗯，这需要仔细考虑一下。',
        '有意思的观点，让我们深入探讨一下。',
        '我明白你的意思了。',
        '这确实值得思考。',
      ];
      
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return { text: fallback, cached: false };
    }
  }

  /**
   * Process a message sent to a punk user
   */
  async processPunkUserMessage(
    conversationId: string,
    senderUserId: string,
    recipientUserId: string,
    message: string
  ): Promise<PunkAIResponse | null> {
    // Check if recipient is a punk user
    const isPunk = await this.isPunkUser(recipientUserId);
    if (!isPunk) {
      return null;
    }

    // Generate AI response
    return await this.generatePunkResponse(conversationId, message, recipientUserId);
  }
}

// Export singleton instance
const punkAIService = new PunkAIService();
export default punkAIService;