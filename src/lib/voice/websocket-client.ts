/**
 * WebSocket Client for Voice Assistant Service
 * Handles real-time audio communication with xiaozhijava backend
 */

import { EventEmitter } from 'events';

export interface VoiceWebSocketConfig {
  url: string;
  deviceId?: string;
  userId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface VoiceMessage {
  type: 'audio' | 'text' | 'control' | 'status';
  data: any;
  timestamp?: number;
  sessionId?: string;
}

export class VoiceWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: VoiceWebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private audioQueue: ArrayBuffer[] = [];
  private sessionId: string | null = null;

  constructor(config: VoiceWebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `${this.config.url}/ws/voice?userId=${this.config.userId}${
      this.config.deviceId ? `&deviceId=${this.config.deviceId}` : ''
    }`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      this.isConnecting = false;
      this.handleError(error);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Voice WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');

      // Send queued audio data if any
      this.flushAudioQueue();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (error) => {
      console.error('Voice WebSocket error:', error);
      this.isConnecting = false;
      this.handleError(error);
    };

    this.ws.onclose = (event) => {
      console.log('Voice WebSocket closed:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.emit('disconnected', { code: event.code, reason: event.reason });

      // Attempt reconnection
      if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    try {
      // Handle binary audio data
      if (data instanceof Blob) {
        data.arrayBuffer().then(buffer => {
          this.emit('audio', buffer);
        });
        return;
      }

      // Handle text messages
      const message: VoiceMessage = typeof data === 'string' ? JSON.parse(data) : data;

      switch (message.type) {
        case 'audio':
          // Audio data received as base64
          if (typeof message.data === 'string') {
            const audioBuffer = this.base64ToArrayBuffer(message.data);
            this.emit('audio', audioBuffer);
          }
          break;

        case 'text':
          this.emit('transcription', message.data);
          break;

        case 'status':
          this.handleStatusMessage(message.data);
          break;

        case 'control':
          this.handleControlMessage(message.data);
          break;

        default:
          this.emit('message', message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle status messages
   */
  private handleStatusMessage(data: any): void {
    if (data.sessionId) {
      this.sessionId = data.sessionId;
    }
    this.emit('status', data);
  }

  /**
   * Handle control messages
   */
  private handleControlMessage(data: any): void {
    switch (data.action) {
      case 'start_recording':
        this.emit('start_recording');
        break;
      case 'stop_recording':
        this.emit('stop_recording');
        break;
      case 'interrupt':
        this.emit('interrupt');
        break;
      default:
        this.emit('control', data);
    }
  }

  /**
   * Send audio data
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send as binary data
      this.ws.send(audioData);
    } else {
      // Queue audio data if not connected
      this.audioQueue.push(audioData);
      if (this.audioQueue.length > 100) {
        // Prevent memory overflow
        this.audioQueue.shift();
      }
    }
  }

  /**
   * Send text message
   */
  sendText(text: string): void {
    this.sendMessage({
      type: 'text',
      data: text,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  /**
   * Send control message
   */
  sendControl(action: string, params?: any): void {
    this.sendMessage({
      type: 'control',
      data: {
        action,
        ...params
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  /**
   * Send generic message
   */
  private sendMessage(message: VoiceMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Flush audio queue
   */
  private flushAudioQueue(): void {
    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift();
      if (audioData) {
        this.sendAudio(audioData);
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    console.log(`Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    this.emit('error', error);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Start voice session
   */
  startSession(): void {
    this.sendControl('start_session');
  }

  /**
   * End voice session
   */
  endSession(): void {
    this.sendControl('end_session');
  }

  /**
   * Start listening
   */
  startListening(): void {
    this.sendControl('start_listening');
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.sendControl('stop_listening');
  }

  /**
   * Interrupt current speech
   */
  interrupt(): void {
    this.sendControl('interrupt');
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
    this.reconnectAttempts = this.config.maxReconnectAttempts!;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.audioQueue = [];
    this.sessionId = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

export default VoiceWebSocketClient;