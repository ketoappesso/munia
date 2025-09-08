import crypto from 'crypto';

// Volcengine TTS API configuration
const VOLCENGINE_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts';
const VOLCENGINE_V2_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts'; // Use v1 for both

// Custom voice credentials (verified and working)
const CUSTOM_VOICE_APP_ID = '7820115171';
const CUSTOM_VOICE_ACCESS_TOKEN = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';
const CUSTOM_VOICE_SECRET_KEY = 'jjGxcdxz6-u5ISj5n1cKgcZmwyBoEKMv';

// Standard voice credentials (for BV001-BV005)
const STANDARD_VOICE_APP_ID = process.env.VOLCENGINE_STANDARD_APP_ID || '6704779984';
const STANDARD_VOICE_ACCESS_TOKEN = process.env.VOLCENGINE_STANDARD_ACCESS_TOKEN || 'QXlNWJpa1Jm80W6Ocdr71N-6bRmnzTVw';

// Response type from Volcengine TTS API
export interface TTSResponse {
  reqid: string;
  code: number;
  Message: string;
  operation: string;
  sequence: number;
  data: string; // Base64 encoded audio data
}

// TTS synthesis parameters
export interface TTSParams {
  text: string;
  voice?: string;
  voiceType?: string;
  encoding?: 'mp3' | 'wav' | 'pcm';
  speed?: number; // 0.5-2.0, default 1.0
  volume?: number; // 0-2.0, default 1.0
  pitch?: number; // 0.5-2.0, default 1.0
}

// Voice options for Chinese TTS
export const CHINESE_VOICES = {
  BV001: 'BV001_streaming', // Chinese female voice (streaming)
  BV002: 'BV002_streaming', // Chinese male voice (streaming)
  BV003: 'BV003_streaming', // Chinese child voice (streaming)
  BV004: 'BV004_streaming', // Chinese news voice (streaming)
  BV005: 'BV005_streaming', // Chinese storytelling voice (streaming)
} as const;

export class VolcengineTTSClient {
  private appId: string;
  private accessToken: string;
  private cluster: string;

  constructor(appId?: string, accessToken?: string, cluster?: string) {
    // Use standard voice credentials by default
    this.appId = appId || STANDARD_VOICE_APP_ID;
    this.accessToken = accessToken || STANDARD_VOICE_ACCESS_TOKEN;
    this.cluster = cluster || 'volcano_icl';
    
    if (!this.accessToken) {
      console.warn('Volcengine TTS access token not configured');
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(params: TTSParams): Promise<Buffer | null> {
    try {
      const requestId = this.generateRequestId();
      
      // Check if this is a custom voice (S_ prefix)
      const isCustomVoice = params.voiceType?.startsWith('S_');
      
      // Build request payload based on voice type
      let payload: any;
      
      if (isCustomVoice) {
        // Custom voice payload with proper credentials
        payload = {
          app: {
            appid: CUSTOM_VOICE_APP_ID,
            token: 'access_token',
            cluster: 'volcano_icl'
          },
          user: {
            uid: 'uid123'
          },
          audio: {
            voice_type: params.voiceType, // S_xxxx format
            encoding: params.encoding || 'mp3',
            speed_ratio: params.speed || 1.0
          },
          request: {
            reqid: requestId,
            text: params.text,
            operation: 'query'
          }
        };
      } else {
        // Standard voice payload with standard credentials
        payload = {
          app: {
            appid: STANDARD_VOICE_APP_ID,
            token: 'access_token',
            cluster: 'volcano_icl',
          },
          user: {
            uid: 'munia-user-001',
          },
          audio: {
            voice_type: params.voiceType || CHINESE_VOICES.BV001,
            encoding: params.encoding || 'mp3',
            speed_ratio: params.speed || 1.0,
            volume_ratio: params.volume || 1.0,
            pitch_ratio: params.pitch || 1.0,
          },
          request: {
            reqid: requestId,
            text: params.text,
            text_type: 'plain',
            operation: 'query',
            with_frontend: 1,
            frontend_type: 'unitTson'
          },
        };
      }

      let headers: Record<string, string>;
      let apiUrl: string;
      
      if (isCustomVoice) {
        // Custom voices use Bearer token with custom credentials
        apiUrl = VOLCENGINE_TTS_URL;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${CUSTOM_VOICE_ACCESS_TOKEN}`,
          'X-Api-Resource-Id': 'volc.megatts.default',
        };
        console.log('Using custom voice API with custom credentials');
      } else {
        // Standard voices use v2 API with standard credentials
        apiUrl = VOLCENGINE_V2_TTS_URL;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${STANDARD_VOICE_ACCESS_TOKEN}`,
          'X-Api-Resource-Id': 'volc.service_type.10029',
        };
        console.log('Using standard voice API with Authorization header');
      }
      
      console.log('TTS API Request:', {
        apiUrl,
        voiceType: params.voiceType,
        isCustomVoice,
        headers: Object.keys(headers), // Log header keys only for security
      });
      
      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      console.log('TTS API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API Error Response:', errorText);
        throw new Error(`TTS API request failed: ${response.statusText}`);
      }

      const result: TTSResponse = await response.json();
      
      console.log('TTS API Result:', {
        code: result.code,
        message: result.Message,
        reqid: result.reqid,
        hasData: !!result.data,
      });

      // Different success codes for different APIs
      // Custom voice returns 3000, standard voice returns 0 or 3000
      const isSuccess = isCustomVoice ? result.code === 3000 : (result.code === 0 || result.code === 3000);
      
      if (!isSuccess) {
        console.error('TTS API Error Details:', result);
        
        // If custom voice fails, try fallback to standard voice
        if (isCustomVoice && result.code === 3001) {
          console.log('Custom voice failed, falling back to standard voice BV001');
          return this.synthesize({
            ...params,
            voiceType: CHINESE_VOICES.BV001,
          });
        }
        
        throw new Error(`TTS API error: ${result.Message || `Code ${result.code}`}`);
      }

      // Decode base64 audio data
      const audioData = Buffer.from(result.data, 'base64');
      return audioData;

    } catch (error) {
      console.error('Error synthesizing speech:', error);
      return null;
    }
  }

  /**
   * Synthesize text and return as base64 string (for client-side use)
   */
  async synthesizeToBase64(params: TTSParams): Promise<string | null> {
    const audioBuffer = await this.synthesize(params);
    if (!audioBuffer) return null;
    
    return audioBuffer.toString('base64');
  }

  /**
   * Synthesize text and return as data URL (for direct audio playback)
   */
  async synthesizeToDataUrl(params: TTSParams): Promise<string | null> {
    const audioBuffer = await this.synthesize(params);
    if (!audioBuffer) return null;
    
    const base64 = audioBuffer.toString('base64');
    const mimeType = params.encoding === 'wav' ? 'audio/wav' : 'audio/mp3';
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Estimate speech duration (rough estimate)
   */
  estimateDuration(text: string, speed: number = 1.0): number {
    // Chinese speech rate is approximately 150-200 characters per minute at normal speed
    const charsPerSecond = 3 * speed;
    return Math.ceil(text.length / charsPerSecond);
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    // Service is configured if we have either standard or custom credentials
    return true; // Both are now hardcoded, so always configured
  }
}

// Export a factory function to create client
export function createVolcengineTTSClient(): VolcengineTTSClient {
  return new VolcengineTTSClient();
}