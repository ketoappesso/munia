import { makeVolcengineRequest } from './signature';

/**
 * MegaTTS Voice Training Status and Types
 */
export type VoiceState = 'Unknown' | 'Training' | 'Success' | 'Active' | 'Expired' | 'Reclaimed';

export interface VoiceStatus {
  SpeakerID: string;
  State: VoiceState;
  CreateTime?: number;
  DemoAudio?: string;
  InstanceNO?: string;
  IsActivable?: boolean;
  Version?: string;
  ExpireTime?: number;
  Alias?: string;
  AvailableTrainingTimes?: number;
  OrderTime?: number;
}

export interface ListMegaTTSTrainStatusRequest {
  AppID: string;
  SpeakerIDs?: string[];
  State?: VoiceState;
  OrderTimeStart?: number;
  OrderTimeEnd?: number;
  ExpireTimeStart?: number;
  ExpireTimeEnd?: number;
}

export interface ListMegaTTSTrainStatusResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: {
      Code: string;
      Message: string;
    };
  };
  Result?: {
    Statuses: VoiceStatus[];
  };
}

export interface BatchListMegaTTSTrainStatusRequest extends ListMegaTTSTrainStatusRequest {
  PageNumber?: number;
  PageSize?: number;
  NextToken?: string;
  MaxResults?: number;
}

export interface BatchListMegaTTSTrainStatusResponse extends ListMegaTTSTrainStatusResponse {
  Result?: {
    AppID: string;
    TotalCount: number;
    NextToken?: string;
    PageNumber?: number;
    PageSize?: number;
    Statuses: VoiceStatus[];
  };
}

/**
 * Voice training status enum for upload/status API
 */
export enum TrainingStatus {
  NotFound = 0,
  Training = 1,
  Success = 2,
  Failed = 3,
  Active = 4
}

/**
 * Model type for voice training
 */
export enum ModelType {
  V1 = 0,        // 1.0 effect
  V2_ICL = 1,    // 2.0 effect (ICL)
  DiT_Standard = 2, // DiT standard (voice only, no style)
  DiT_Restore = 3   // DiT restore (voice + accent/speed style)
}

/**
 * Language codes for voice training
 */
export enum Language {
  Chinese = 0,
  English = 1,
  Japanese = 2,
  Spanish = 3,
  Indonesian = 4,
  Portuguese = 5,
  German = 6,    // Only for ModelType.DiT_Standard
  French = 7     // Only for ModelType.DiT_Standard
}

/**
 * Phone number to SpeakerID mapping
 * DEPRECATED: Now using database User.ttsVoiceId field instead
 * Kept for backwards compatibility only
 */
const PHONE_TO_SPEAKER_MAP: Record<string, string> = {
  // Legacy mappings - use database instead
};

export class MegaTTSClient {
  private appId: string;
  private accessKeyId: string;
  private secretKey: string;
  private accessToken: string;
  
  constructor(config?: {
    appId?: string;
    accessKeyId?: string;
    secretKey?: string;
    accessToken?: string;
  }) {
    this.appId = config?.appId || process.env.VOLCENGINE_TTS_APP_ID || '7820115171';
    this.accessKeyId = config?.accessKeyId || process.env.TOS_ACCESS_KEY || '';
    this.secretKey = config?.secretKey || process.env.TOS_SECRET_KEY || '';
    this.accessToken = config?.accessToken || process.env.VOLCENGINE_TTS_ACCESS_TOKEN || '';
  }
  
  /**
   * Get SpeakerID from phone number
   * @deprecated Use database User.ttsVoiceId field directly instead
   */
  getSpeakerIdFromPhone(phoneNumber: string): string | null {
    // This method is deprecated - use database User.ttsVoiceId field instead
    // Only kept for backwards compatibility
    console.warn('getSpeakerIdFromPhone is deprecated. Use database User.ttsVoiceId field directly.');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return PHONE_TO_SPEAKER_MAP[cleanPhone] || null;
  }
  
  /**
   * List voice training status
   */
  async listTrainStatus(
    speakerIds?: string[],
    state?: VoiceState
  ): Promise<VoiceStatus[]> {
    const request: ListMegaTTSTrainStatusRequest = {
      AppID: this.appId,
      ...(speakerIds && { SpeakerIDs: speakerIds }),
      ...(state && { State: state })
    };
    
    try {
      const response = await makeVolcengineRequest(
        'ListMegaTTSTrainStatus',
        request,
        {
          accessKeyId: this.accessKeyId,
          secretKey: this.secretKey,
          region: 'cn-north-1',
          service: 'speech_saas_prod',
          version: '2023-11-07'
        }
      );
      
      if (response.ResponseMetadata?.Error) {
        throw new Error(response.ResponseMetadata.Error.Message);
      }
      
      return response.Result?.Statuses || [];
    } catch (error) {
      console.error('Error fetching voice training status:', error);
      throw error;
    }
  }
  
  /**
   * Get voice status using direct API
   */
  async getVoiceStatus(speakerId: string): Promise<{
    status: number;
    hasVoice: boolean;
    remainingTrainings?: number;
  }> {
    const result = await this.checkTrainingStatus(speakerId);

    // Map training status to expected format
    return {
      status: result.status,
      hasVoice: result.status === TrainingStatus.Success || result.status === TrainingStatus.Active,
      // Use the actual remaining trainings from API response
      remainingTrainings: result.remainingTrainings
    };
  }
  
  /**
   * Get voice status by phone number
   * @deprecated Use database User.ttsVoiceId field and query by speakerId directly
   */
  async getStatusByPhone(phoneNumber: string): Promise<VoiceStatus | null> {
    // This method is deprecated - use database User.ttsVoiceId field instead
    console.warn('getStatusByPhone is deprecated. Use database User.ttsVoiceId and query by speakerId directly.');
    const speakerId = this.getSpeakerIdFromPhone(phoneNumber);
    if (!speakerId) {
      console.log('No speaker ID found for phone:', phoneNumber);
      return null;
    }

    const statuses = await this.listTrainStatus([speakerId]);
    return statuses[0] || null;
  }
  
  /**
   * Batch list voice training status with pagination
   */
  async batchListTrainStatus(
    params: {
      speakerIds?: string[];
      state?: VoiceState;
      pageNumber?: number;
      pageSize?: number;
      nextToken?: string;
    } = {}
  ): Promise<BatchListMegaTTSTrainStatusResponse['Result']> {
    const request: BatchListMegaTTSTrainStatusRequest = {
      AppID: this.appId,
      ...(params.speakerIds && { SpeakerIDs: params.speakerIds }),
      ...(params.state && { State: params.state }),
      ...(params.pageNumber && { PageNumber: params.pageNumber }),
      ...(params.pageSize && { PageSize: params.pageSize }),
      ...(params.nextToken && { NextToken: params.nextToken })
    };
    
    try {
      const response = await makeVolcengineRequest(
        'BatchListMegaTTSTrainStatus',
        request,
        {
          accessKeyId: this.accessKeyId,
          secretKey: this.secretKey,
          region: 'cn-north-1',
          service: 'speech_saas_prod',
          version: '2023-11-07'
        }
      );
      
      if (response.ResponseMetadata?.Error) {
        throw new Error(response.ResponseMetadata.Error.Message);
      }
      
      return response.Result || {
        AppID: this.appId,
        TotalCount: 0,
        Statuses: []
      };
    } catch (error) {
      console.error('Error batch fetching voice training status:', error);
      throw error;
    }
  }
  
  /**
   * Upload audio for voice training - Direct to MegaTTS API
   */
  async uploadTrainingAudio(
    speakerId: string,
    audioBuffer: Buffer,
    audioFormat: string,
    text?: string,
    modelType: ModelType = ModelType.V2_ICL,
    language: Language = Language.Chinese
  ): Promise<{ success: boolean; speakerId?: string; error?: string; statusCode?: number }> {
    try {
      // Convert audio buffer to base64
      const audioBase64 = audioBuffer.toString('base64');
      
      // Build request body matching official Python code
      const requestBody = {
        appid: this.appId,
        speaker_id: speakerId,
        audios: [{
          audio_bytes: audioBase64,
          audio_format: audioFormat.toLowerCase(), // Ensure lowercase format
          ...(text && { text })
        }],
        source: 2, // Fixed value as per documentation
        language: language,
        model_type: modelType
      };
      
      console.log('Uploading to MegaTTS:', {
        appid: this.appId,
        speaker_id: speakerId,
        audio_format: audioFormat,
        audio_size: audioBuffer.length,
        has_text: !!text,
        language,
        model_type: modelType
      });
      
      const response = await fetch('https://openspeech.bytedance.com/api/v1/mega_tts/audio/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${this.accessToken}`,
          'Resource-Id': 'volc.megatts.voiceclone'
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log('MegaTTS upload response:', {
        fullResponse: result,
        statusCode: result.BaseResp?.StatusCode,
        statusMessage: result.BaseResp?.StatusMessage,
        speakerId: result.speaker_id
      });

      if (result.BaseResp?.StatusCode === 0) {
        return {
          success: true,
          speakerId: result.speaker_id || speakerId
        };
      } else {
        const errorMessages: Record<number, string> = {
          1001: '请求参数有误',
          1101: '音频上传失败',
          1102: 'ASR转写失败',
          1103: 'SID声纹检测失败',
          1104: '声纹与名人相似度过高',
          1105: '获取音频数据失败',
          1106: 'SpeakerID重复',
          1107: 'SpeakerID未找到',
          1108: '音频转码失败',
          1109: '音频与文本对比字错率过高',
          1111: '未检测到说话声',
          1112: '信噪比过高',
          1113: '降噪处理失败',
          1114: '音频质量低',
          1122: '未检测到人声',
          1123: '已达上传次数限制（最多10次）'
        };
        
        const statusCode = result.BaseResp?.StatusCode;
        return {
          success: false,
          speakerId,
          error: errorMessages[statusCode] || result.BaseResp?.StatusMessage || '上传失败',
          statusCode
        };
      }
    } catch (error) {
      console.error('Error uploading training audio:', error);
      return {
        success: false,
        speakerId,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }
  
  /**
   * Check voice training status (direct API)
   */
  async checkTrainingStatus(speakerId: string): Promise<{
    status: TrainingStatus;
    createTime?: number;
    version?: string;
    demoAudio?: string;
    remainingTrainings?: number;
    error?: string;
  }> {
    try {
      const requestBody = {
        appid: this.appId,
        speaker_id: speakerId
      };
      
      const response = await fetch('https://openspeech.bytedance.com/api/v1/mega_tts/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${this.accessToken}`,
          'Resource-Id': 'volc.megatts.voiceclone'
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();

      // Log ALL fields to find the correct field name
      console.log('MegaTTS status FULL response:', JSON.stringify(result, null, 2));
      console.log('MegaTTS status fields:', {
        hasRemainingTrainingTimes: 'remaining_training_times' in result,
        hasAvailableTrainingTimes: 'available_training_times' in result,
        hasTrainingTimes: 'training_times' in result,
        hasRemainingTimes: 'remaining_times' in result,
        allKeys: Object.keys(result)
      });

      if (result.BaseResp?.StatusCode === 0) {
        // Try multiple possible field names
        let remainingCount;

        // Check various possible field names for remaining trainings
        if (result.remaining_training_times !== undefined) {
          remainingCount = result.remaining_training_times;
          console.log('Using remaining_training_times:', remainingCount);
        } else if (result.available_training_times !== undefined) {
          remainingCount = result.available_training_times;
          console.log('Using available_training_times:', remainingCount);
        } else if (result.training_times !== undefined) {
          remainingCount = result.training_times;
          console.log('Using training_times:', remainingCount);
        } else if (result.remaining_times !== undefined) {
          remainingCount = result.remaining_times;
          console.log('Using remaining_times:', remainingCount);
        } else {
          // Check if the count is embedded in data field
          if (result.data?.remaining_training_times !== undefined) {
            remainingCount = result.data.remaining_training_times;
            console.log('Using data.remaining_training_times:', remainingCount);
          } else {
            // If API doesn't provide the count, we can't know the real value
            console.log('WARNING: API did not return remaining trainings count!');
            remainingCount = undefined; // Don't assume any value
          }
        }

        console.log('Final calculated remaining trainings:', remainingCount);

        return {
          status: result.status || TrainingStatus.Success,
          createTime: result.create_time,
          version: result.version,
          demoAudio: result.demo_audio,
          remainingTrainings: remainingCount
        };
      } else {
        return {
          status: TrainingStatus.NotFound,
          error: result.BaseResp?.StatusMessage || '查询失败'
        };
      }
    } catch (error) {
      console.error('Error checking training status:', error);
      return {
        status: TrainingStatus.NotFound,
        error: error instanceof Error ? error.message : '查询失败'
      };
    }
  }
  
  /**
   * Format voice status for display
   */
  formatStatus(status: VoiceStatus): {
    displayName: string;
    stateText: string;
    stateColor: string;
    trainingVersion: string;
    remainingTrainings: number;
    isActive: boolean;
    canTrain: boolean;
    expiryDate?: Date;
  } {
    const stateColors: Record<VoiceState, string> = {
      'Unknown': 'gray',
      'Training': 'blue',
      'Success': 'green',
      'Active': 'purple',
      'Expired': 'red',
      'Reclaimed': 'gray'
    };
    
    const stateTexts: Record<VoiceState, string> = {
      'Unknown': '未知',
      'Training': '训练中',
      'Success': '训练完成',
      'Active': '已激活',
      'Expired': '已过期',
      'Reclaimed': '已回收'
    };
    
    return {
      displayName: status.Alias || status.SpeakerID,
      stateText: stateTexts[status.State] || '未知',
      stateColor: stateColors[status.State] || 'gray',
      trainingVersion: status.Version || 'V1',
      remainingTrainings: status.AvailableTrainingTimes || 0,
      isActive: status.State === 'Active',
      canTrain: (status.AvailableTrainingTimes || 0) > 0 && status.State !== 'Expired',
      expiryDate: status.ExpireTime ? new Date(status.ExpireTime) : undefined
    };
  }
}

// Export singleton instance
export const megaTTSClient = new MegaTTSClient();