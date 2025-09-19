'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { VoiceWebSocketClient } from '@/lib/voice/websocket-client';
import { VoiceServiceGateway } from '@/lib/voice/api-gateway';
import { useVolcengineTTS } from '@/hooks/useVolcengineTTS';
import AudioVisualizer from './AudioVisualizer';
import DeviceSelector from './DeviceSelector';
import RoleSelector from './RoleSelector';
import ConversationHistory from './ConversationHistory';

interface VoiceAssistantProps {
  className?: string;
  defaultDeviceId?: string;
  onClose?: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  className = '',
  defaultDeviceId,
  onClose
}) => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(defaultDeviceId || null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsClientRef = useRef<VoiceWebSocketClient | null>(null);
  const apiGatewayRef = useRef<VoiceServiceGateway | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const { synthesize, isLoading: isSynthesizing } = useVolcengineTTS();

  // Initialize API gateway
  useEffect(() => {
    if (session?.user?.id) {
      apiGatewayRef.current = new VoiceServiceGateway();
    }
  }, [session]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!session?.user?.id || !selectedDevice) return;

    const wsUrl = process.env.NEXT_PUBLIC_VOICE_WS_URL || 'ws://localhost:8091';

    wsClientRef.current = new VoiceWebSocketClient({
      url: wsUrl,
      userId: session.user.id,
      deviceId: selectedDevice
    });

    // Set up event listeners
    wsClientRef.current.on('connected', () => {
      setIsConnected(true);
      setError(null);
      console.log('Voice WebSocket connected');
    });

    wsClientRef.current.on('disconnected', () => {
      setIsConnected(false);
      setIsListening(false);
    });

    wsClientRef.current.on('error', (err) => {
      console.error('Voice WebSocket error:', err);
      setError('连接错误，请稍后重试');
    });

    wsClientRef.current.on('transcription', (text: string) => {
      setCurrentTranscript(text);
      setConversation(prev => [...prev, {
        role: 'user',
        content: text,
        timestamp: new Date()
      }]);
    });

    wsClientRef.current.on('audio', async (audioData: ArrayBuffer) => {
      audioQueueRef.current.push(audioData);
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    });

    wsClientRef.current.on('status', (status: any) => {
      if (status.isSpeaking !== undefined) {
        setIsSpeaking(status.isSpeaking);
      }
    });

    wsClientRef.current.on('start_recording', () => {
      startRecording();
    });

    wsClientRef.current.on('stop_recording', () => {
      stopRecording();
    });

    wsClientRef.current.connect();

    return () => {
      wsClientRef.current?.disconnect();
    };
  }, [session, selectedDevice]);

  // Play audio queue
  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const audioData = audioQueueRef.current.shift()!;
    const audioBlob = new Blob([audioData], { type: 'audio/opus' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      playNextAudio();
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      URL.revokeObjectURL(audioUrl);
      playNextAudio();
    };

    if (!isMuted) {
      await audio.play().catch(console.error);
    }
  };

  // Initialize media recorder for audio input
  const initializeMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Visualize audio levels
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        if (isListening) {
          requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsClientRef.current?.isConnected()) {
          const arrayBuffer = await event.data.arrayBuffer();
          wsClientRef.current.sendAudio(arrayBuffer);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        updateAudioLevel();
      };

    } catch (err) {
      console.error('Failed to initialize media recorder:', err);
      setError('无法访问麦克风，请检查权限设置');
    }
  }, [isListening]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) {
      await initializeMediaRecorder();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start(100); // Send data every 100ms
      setIsListening(true);
      wsClientRef.current?.startListening();
    }
  }, [initializeMediaRecorder]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      wsClientRef.current?.stopListening();
    }
  }, []);

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Toggle connection
  const toggleConnection = () => {
    if (isConnected) {
      wsClientRef.current?.disconnect();
      setIsConnected(false);
    } else {
      initializeWebSocket();
    }
  };

  // Interrupt speech
  const handleInterrupt = () => {
    audioQueueRef.current = [];
    setIsSpeaking(false);
    wsClientRef.current?.interrupt();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      wsClientRef.current?.disconnect();
      mediaRecorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  // Auto-connect when device is selected
  useEffect(() => {
    if (selectedDevice && session?.user?.id) {
      initializeWebSocket();
    }
  }, [selectedDevice, session, initializeWebSocket]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-bold">智能语音助手</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="设置"
          >
            <Settings size={20} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="关闭"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800 border-b border-gray-700 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <DeviceSelector
                selectedDevice={selectedDevice}
                onSelectDevice={setSelectedDevice}
                userId={session?.user?.id || ''}
              />
              <RoleSelector
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Audio Visualizer */}
        <div className="relative h-32 bg-gradient-to-b from-gray-800 to-gray-900">
          <AudioVisualizer
            isActive={isListening || isSpeaking}
            audioLevel={audioLevel}
            type={isListening ? 'listening' : 'speaking'}
          />

          {/* Connection Status */}
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1 ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-hidden">
          <ConversationHistory
            messages={conversation}
            currentTranscript={currentTranscript}
            isListening={isListening}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Control Panel */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4">
            {/* Connect/Disconnect Button */}
            <button
              onClick={toggleConnection}
              disabled={!selectedDevice}
              className={`p-3 rounded-full transition-all ${
                isConnected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
              }`}
              title={isConnected ? '断开连接' : '连接'}
            >
              {isConnected ? <PhoneOff size={24} /> : <Phone size={24} />}
            </button>

            {/* Record Button */}
            <button
              onClick={toggleListening}
              disabled={!isConnected}
              className={`p-4 rounded-full transition-all ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500'
              }`}
              title={isListening ? '停止录音' : '开始录音'}
            >
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-all ${
                isMuted
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Interrupt Button */}
            {isSpeaking && (
              <button
                onClick={handleInterrupt}
                className="p-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white animate-bounce"
                title="打断"
              >
                <Loader2 size={24} className="animate-spin" />
              </button>
            )}
          </div>

          {/* Status Text */}
          <div className="mt-4 text-center text-sm text-gray-400">
            {isListening && '正在聆听...'}
            {isSpeaking && '正在回复...'}
            {!isListening && !isSpeaking && isConnected && '准备就绪'}
            {!isConnected && '请选择设备并连接'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;