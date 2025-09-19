'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onPartialResult?: (text: string) => void;
  onAutoSend?: (text: string) => void;
  onError?: (error: Error) => void;
  wsUrl?: string;
  useXiaozhiProtocol?: boolean; // 是否使用xiaozhi-server协议
}

interface VoiceInputState {
  isRecording: boolean;
  isConnecting: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    onTranscript,
    onPartialResult,
    onAutoSend,
    onError,
    wsUrl = 'ws://localhost:8000/xiaozhi/v1/', // 默认使用xiaozhi-server
    useXiaozhiProtocol = true // 默认启用xiaozhi协议
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isConnecting: false,
    transcript: '',
    partialTranscript: '',
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      // 处理二进制音频数据（来自服务器的TTS等）
      if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
        console.log('Received binary audio data from server');
        return;
      }

      const data = JSON.parse(event.data);

      if (useXiaozhiProtocol) {
        // xiaozhi-server协议处理
        switch (data.type) {
          case 'hello':
            console.log('Xiaozhi server handshake successful:', data);
            setState(prev => ({ ...prev, isConnecting: false }));
            break;

          case 'stt':
            // 语音识别结果
            const recognizedText = data.text || '';
            if (recognizedText) {
              setState(prev => ({ ...prev, partialTranscript: recognizedText }));
              onPartialResult?.(recognizedText);

              // 自动发送逻辑
              if (vadTimeoutRef.current) {
                clearTimeout(vadTimeoutRef.current);
              }

              vadTimeoutRef.current = setTimeout(() => {
                if (recognizedText.trim()) {
                  onAutoSend?.(recognizedText.trim());
                  setState(prev => ({
                    ...prev,
                    transcript: '',
                    partialTranscript: ''
                  }));
                }
              }, 1000);
            }
            break;

          case 'llm':
            // 大模型回复（可选处理）
            console.log('LLM response:', data.text);
            break;

          case 'tts':
            // TTS状态消息
            console.log('TTS status:', data.state);
            break;

          case 'error':
            setState(prev => ({ ...prev, error: data.message || 'Unknown error' }));
            onError?.(new Error(data.message || 'Unknown error'));
            break;

          default:
            console.log('Unknown xiaozhi message type:', data.type);
        }
      } else {
        // 原有协议处理（保持向后兼容）
        switch (data.type) {
          case 'partial_result':
            setState(prev => ({ ...prev, partialTranscript: data.text }));
            onPartialResult?.(data.text);

            if (vadTimeoutRef.current) {
              clearTimeout(vadTimeoutRef.current);
            }

            if (data.text && data.text.trim()) {
              vadTimeoutRef.current = setTimeout(() => {
                if (data.text && data.text.trim()) {
                  onAutoSend?.(data.text.trim());
                  setState(prev => ({
                    ...prev,
                    transcript: '',
                    partialTranscript: ''
                  }));
                }
              }, 1000);
            }
            break;

          case 'final_result':
            setState(prev => ({ ...prev, transcript: data.text, partialTranscript: '' }));
            onTranscript?.(data.text);
            break;

          case 'vad_detected':
            if (state.partialTranscript && state.partialTranscript.trim()) {
              onAutoSend?.(state.partialTranscript.trim());
              setState(prev => ({
                ...prev,
                transcript: '',
                partialTranscript: ''
              }));
            }
            break;

          case 'error':
            setState(prev => ({ ...prev, error: data.message }));
            onError?.(new Error(data.message));
            break;

          case 'connected':
            console.log('WebSocket connected successfully');
            setState(prev => ({ ...prev, isConnecting: false }));
            break;
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [onTranscript, onPartialResult, onAutoSend, onError, state.partialTranscript, useXiaozhiProtocol]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    return new Promise<void>((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connection opened');
          setState(prev => ({ ...prev, isConnecting: false }));
          wsRef.current = ws;

          ws.send(JSON.stringify({
            type: 'config',
            config: {
              language: 'zh-CN',
              sampleRate: 16000,
              enableVAD: true,
              vadSilenceThreshold: 1000,
            }
          }));

          resolve();
        };

        ws.onmessage = handleWebSocketMessage;

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setState(prev => ({
            ...prev,
            isConnecting: false,
            error: 'WebSocket连接错误'
          }));
          onError?.(new Error('WebSocket connection error'));
          reject(error);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          wsRef.current = null;
          setState(prev => ({ ...prev, isConnecting: false }));
        };
      } catch (error) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: '无法建立连接'
        }));
        reject(error);
      }
    });
  }, [wsUrl, handleWebSocketMessage, onError]);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      await connectWebSocket();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result?.toString().split(',')[1];
              if (base64Audio) {
                wsRef.current?.send(JSON.stringify({
                  type: 'audio',
                  audio: base64Audio,
                  format: 'webm'
                }));
              }
            };
            reader.readAsDataURL(event.data);
          }
        }
      };

      mediaRecorder.start(100);
      setState(prev => ({ ...prev, isRecording: true }));
      wsRef.current?.send(JSON.stringify({ type: 'start' }));

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '无法启动录音'
      }));
      onError?.(error instanceof Error ? error : new Error('Failed to start recording'));
    }
  }, [connectWebSocket, onError]);

  const stopRecording = useCallback(() => {
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = undefined;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      if (state.partialTranscript && state.partialTranscript.trim()) {
        onAutoSend?.(state.partialTranscript.trim());
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      setTimeout(() => {
        wsRef.current?.close();
        wsRef.current = null;
      }, 100);
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      transcript: '',
      partialTranscript: ''
    }));

    mediaRecorderRef.current = null;
  }, [state.partialTranscript, onAutoSend]);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
      }
      if (state.isRecording) {
        stopRecording();
      }
    };
  }, []);

  return {
    isRecording: state.isRecording,
    isConnecting: state.isConnecting,
    transcript: state.transcript,
    partialTranscript: state.partialTranscript,
    error: state.error,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}