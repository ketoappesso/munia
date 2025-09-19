/**
 * API Gateway for Voice Assistant Service
 * Handles communication with xiaozhijava backend
 */

const XIAOZHI_BASE_URL = process.env.XIAOZHI_SERVICE_URL || 'http://localhost:8091';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  type?: string;
  status?: 'online' | 'offline';
  roleId?: number;
  functionNames?: string;
  ip?: string;
  wifiName?: string;
  chipModelName?: string;
  version?: string;
  lastLogin?: string;
}

export interface VoiceRole {
  roleId: number;
  roleName: string;
  roleDesc?: string;
  avatar?: string;
  ttsId?: number;
  ttsVoice?: string;
  systemPrompt?: string;
}

export interface VoiceSession {
  sessionId: string;
  deviceId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  messages: VoiceMessage[];
}

export interface VoiceMessage {
  messageId?: number;
  deviceId: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  roleId?: number;
  message?: string;
  messageType?: string;
  audioPath?: string;
  createTime?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}

export class VoiceServiceGateway {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(apiKey?: string) {
    this.baseUrl = XIAOZHI_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey })
    };
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ==================== Device Management ====================

  /**
   * Get all devices for a user
   */
  async getDevices(userId: string): Promise<DeviceInfo[]> {
    const response = await this.request<{ data: DeviceInfo[] }>(
      `/api/device/query?userId=${userId}`,
      { method: 'GET' }
    );
    return response.data?.data || [];
  }

  /**
   * Create or register a new device
   */
  async createDevice(userId: string, deviceInfo: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const response = await this.request<DeviceInfo>(
      '/api/device/add',
      {
        method: 'POST',
        body: JSON.stringify({
          ...deviceInfo,
          userId
        })
      }
    );
    return response.data!;
  }

  /**
   * Update device information
   */
  async updateDevice(deviceId: string, updates: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const response = await this.request<DeviceInfo>(
      '/api/device/update',
      {
        method: 'PUT',
        body: JSON.stringify({
          deviceId,
          ...updates
        })
      }
    );
    return response.data!;
  }

  /**
   * Delete a device
   */
  async deleteDevice(deviceId: string): Promise<boolean> {
    const response = await this.request<boolean>(
      `/api/device/delete/${deviceId}`,
      { method: 'DELETE' }
    );
    return response.code === 200;
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<string> {
    const response = await this.request<{ status: string }>(
      `/api/device/status/${deviceId}`,
      { method: 'GET' }
    );
    return response.data?.status || 'offline';
  }

  // ==================== Role Management ====================

  /**
   * Get all available roles
   */
  async getRoles(): Promise<VoiceRole[]> {
    const response = await this.request<{ data: VoiceRole[] }>(
      '/api/role/query',
      { method: 'GET' }
    );
    return response.data?.data || [];
  }

  /**
   * Create a new role
   */
  async createRole(role: Partial<VoiceRole>): Promise<VoiceRole> {
    const response = await this.request<VoiceRole>(
      '/api/role/add',
      {
        method: 'POST',
        body: JSON.stringify(role)
      }
    );
    return response.data!;
  }

  /**
   * Update role
   */
  async updateRole(roleId: number, updates: Partial<VoiceRole>): Promise<VoiceRole> {
    const response = await this.request<VoiceRole>(
      '/api/role/update',
      {
        method: 'PUT',
        body: JSON.stringify({
          roleId,
          ...updates
        })
      }
    );
    return response.data!;
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: number): Promise<boolean> {
    const response = await this.request<boolean>(
      `/api/role/delete/${roleId}`,
      { method: 'DELETE' }
    );
    return response.code === 200;
  }

  // ==================== Message Management ====================

  /**
   * Get conversation history
   */
  async getConversationHistory(
    deviceId: string,
    sessionId?: string,
    limit: number = 50
  ): Promise<VoiceMessage[]> {
    const params = new URLSearchParams({
      deviceId,
      ...(sessionId && { sessionId }),
      limit: limit.toString()
    });

    const response = await this.request<{ data: VoiceMessage[] }>(
      `/api/message/query?${params}`,
      { method: 'GET' }
    );
    return response.data?.data || [];
  }

  /**
   * Delete conversation messages
   */
  async deleteMessages(messageIds: number[]): Promise<boolean> {
    const response = await this.request<boolean>(
      '/api/message/delete',
      {
        method: 'POST',
        body: JSON.stringify({ messageIds })
      }
    );
    return response.code === 200;
  }

  /**
   * Clear device memory/conversation
   */
  async clearDeviceMemory(deviceId: string): Promise<boolean> {
    const response = await this.request<boolean>(
      `/api/message/clear/${deviceId}`,
      { method: 'POST' }
    );
    return response.code === 200;
  }

  // ==================== Session Management ====================

  /**
   * Start a voice session
   */
  async startVoiceSession(deviceId: string, userId: string): Promise<VoiceSession> {
    const response = await this.request<VoiceSession>(
      '/api/session/start',
      {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          userId
        })
      }
    );
    return response.data!;
  }

  /**
   * End a voice session
   */
  async endVoiceSession(sessionId: string): Promise<boolean> {
    const response = await this.request<boolean>(
      `/api/session/end/${sessionId}`,
      { method: 'POST' }
    );
    return response.code === 200;
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId: string): Promise<VoiceSession[]> {
    const response = await this.request<{ data: VoiceSession[] }>(
      `/api/session/active?userId=${userId}`,
      { method: 'GET' }
    );
    return response.data?.data || [];
  }

  // ==================== TTS Configuration ====================

  /**
   * Get available TTS voices
   */
  async getTTSVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    const response = await this.request<{ data: Array<{ id: string; name: string; language: string }> }>(
      '/api/tts/voices',
      { method: 'GET' }
    );
    return response.data?.data || [];
  }

  /**
   * Configure TTS for device
   */
  async configureTTS(deviceId: string, ttsConfig: {
    voiceId: string;
    speed?: number;
    pitch?: number;
    volume?: number;
  }): Promise<boolean> {
    const response = await this.request<boolean>(
      `/api/device/tts-config`,
      {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          ...ttsConfig
        })
      }
    );
    return response.code === 200;
  }

  // ==================== Voice Cloning ====================

  /**
   * Upload audio samples for voice cloning
   */
  async uploadVoiceSample(
    userId: string,
    audioFile: File,
    metadata?: {
      name?: string;
      description?: string;
    }
  ): Promise<{ sampleId: string; status: string }> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('userId', userId);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(`${this.baseUrl}/api/voice-clone/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get voice cloning status
   */
  async getVoiceCloneStatus(sampleId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    voiceId?: string;
    error?: string;
  }> {
    const response = await this.request<{
      status: 'pending' | 'processing' | 'completed' | 'failed';
      voiceId?: string;
      error?: string;
    }>(
      `/api/voice-clone/status/${sampleId}`,
      { method: 'GET' }
    );
    return response.data!;
  }

  /**
   * List user's cloned voices
   */
  async getClonedVoices(userId: string): Promise<Array<{
    voiceId: string;
    name: string;
    status: string;
    createdAt: string;
  }>> {
    const response = await this.request<{ data: Array<{
      voiceId: string;
      name: string;
      status: string;
      createdAt: string;
    }> }>(
      `/api/voice-clone/list?userId=${userId}`,
      { method: 'GET' }
    );
    return response.data?.data || [];
  }

  // ==================== Smart Home Integration ====================

  /**
   * Control IoT device through voice command
   */
  async controlIoTDevice(command: {
    deviceId: string;
    action: string;
    parameters?: Record<string, any>;
  }): Promise<{ success: boolean; response?: any }> {
    const response = await this.request<{ success: boolean; response?: any }>(
      '/api/iot/control',
      {
        method: 'POST',
        body: JSON.stringify(command)
      }
    );
    return response.data!;
  }

  /**
   * Get IoT device list
   */
  async getIoTDevices(userId: string): Promise<Array<{
    deviceId: string;
    name: string;
    type: string;
    status: string;
    capabilities: string[];
  }>> {
    const response = await this.request<{ data: Array<{
      deviceId: string;
      name: string;
      type: string;
      status: string;
      capabilities: string[];
    }> }>(
      `/api/iot/devices?userId=${userId}`,
      { method: 'GET' }
    );
    return response.data?.data || [];
  }
}

export default VoiceServiceGateway;