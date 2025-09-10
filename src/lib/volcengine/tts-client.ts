import crypto from 'crypto';

// Volcengine TTS API configuration - Updated for v3
const VOLCENGINE_V1_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts';
const VOLCENGINE_V3_TTS_URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

// Unified credentials for v3 API (both custom and standard voices)
const VOLCENGINE_APP_ID = '7820115171';
const VOLCENGINE_ACCESS_KEY = 'o2H8GJLh9eO-7kuzzyw93To2iJ1C6YC-';
const VOLCENGINE_SECRET_KEY = 'jjGxcdxz6-u5ISj5n1cKgcZmwyBoEKMv';

// Resource IDs for different voice types
const RESOURCE_IDS = {
  BIGTTS: 'volc.service_type.10029',  // 大模型语音合成（字符版）
  BIGTTS_CONCURR: 'volc.service_type.10048',  // 大模型语音合成（并发版）
  MEGATTS: 'volc.megatts.default',  // 声音复刻2.0（字符版）
  MEGATTS_CONCURR: 'volc.megatts.concurr',  // 声音复刻2.0（并发版）
};

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

// Voice options for Volcengine TTS
// Currently confirmed working voices with v3 API and BigTTS resource ID
export const VOLCENGINE_VOICES = {
  // 女声 (Female voices)
  FEMALE_SHUANGKUAI: 'zh_female_shuangkuaisisi_moon_bigtts',  // 双快思思月光
  
  // 男声 (Male voices)
  MALE_AHU: 'zh_male_ahu_conversation_wvae_bigtts',  // 阿虎对话
} as const;

// Alias for backward compatibility
export const CHINESE_VOICES = VOLCENGINE_VOICES;

export class VolcengineTTSClient {
  private appId: string;
  private accessToken: string;
  private cluster: string;

  constructor(appId?: string, accessToken?: string, cluster?: string) {
    // Use unified credentials for v3 API
    this.appId = appId || VOLCENGINE_APP_ID;
    this.accessToken = accessToken || VOLCENGINE_ACCESS_KEY;
    this.cluster = cluster || 'volcano_tts';
    
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
   * Synthesize text to speech using v3 API
   */
  async synthesize(params: TTSParams): Promise<Buffer | null> {
    try {
      const requestId = this.generateRequestId();
      
      // Check voice type
      const isCustomVoice = params.voiceType?.startsWith('S_');
      const isBigTTSVoice = params.voiceType?.includes('bigtts');
      
      // Use v3 API for all voices
      const apiUrl = VOLCENGINE_V3_TTS_URL;
      
      // Determine resource ID based on voice type
      let resourceId: string;
      if (isCustomVoice) {
        resourceId = RESOURCE_IDS.MEGATTS;  // Custom voices use MegaTTS
      } else if (isBigTTSVoice) {
        resourceId = RESOURCE_IDS.BIGTTS;  // BigTTS voices
      } else {
        resourceId = RESOURCE_IDS.BIGTTS;  // Default to BigTTS for standard voices
      }
      
      // Build v3 API request payload
      const payload = {
        user: {
          uid: 'appesso-user'
        },
        req_params: {
          text: params.text,
          speaker: params.voiceType || VOLCENGINE_VOICES.FEMALE_SHUANGKUAI,
          audio_params: {
            format: params.encoding || 'mp3',
            sample_rate: 24000,
            speech_rate: Math.round((params.speed || 1.0) * 50 - 50), // Convert to [-50, 100] range
            loudness_rate: Math.round((params.volume || 1.0) * 50 - 50), // Convert to [-50, 100] range
          }
        }
      };
      
      // v3 API headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Api-App-Id': VOLCENGINE_APP_ID,
        'X-Api-Access-Key': VOLCENGINE_ACCESS_KEY,
        'X-Api-Resource-Id': resourceId,
        'X-Api-Request-Id': requestId,
      };
      
      console.log('TTS v3 API Request:', {
        apiUrl,
        speaker: params.voiceType,
        resourceId,
        headers: Object.keys(headers),
        textPreview: params.text.substring(0, 20),
        appId: VOLCENGINE_APP_ID,
      });
      
      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      console.log('TTS v3 API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS v3 API Error Response:', errorText);
        throw new Error(`TTS v3 API request failed: ${response.statusText}`);
      }

      // v3 API may return streaming response
      const responseText = await response.text();
      
      // v3 API returns multiple JSON objects separated by newlines
      const jsonLines = responseText.split('\n').filter(line => line.trim());
      let audioData = '';
      
      for (const line of jsonLines) {
        try {
          const result = JSON.parse(line);
          
          console.log('TTS v3 API Response Line:', {
            code: result.code,
            message: result.message,
            hasData: !!result.data,
          });
          
          // v3 API success codes: 0 for data, 20000000 for completion
          if (result.code === 0 && result.data) {
            audioData += result.data;
          } else if (result.code === 20000000) {
            // End of stream
            console.log('TTS v3 API: Stream completed successfully');
          } else if (result.code !== 0 && result.code !== 20000000) {
            console.error('TTS v3 API Error:', result);
            
            // If standard voice fails, could try fallback
            if (!isCustomVoice && result.message?.includes('resource ID is mismatched')) {
              console.log('Standard voice failed, resource mismatch');
            }
            
            throw new Error(`TTS v3 API error: ${result.message || `Code ${result.code}`}`);
          }
        } catch (e) {
          console.error('Error parsing v3 response line:', e, 'Line:', line);
        }
      }
      
      if (!audioData) {
        console.error('No audio data received from v3 API');
        return null;
      }

      // Decode base64 audio data
      const audioBuffer = Buffer.from(audioData, 'base64');
      return audioBuffer;

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