'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { STANDARD_VOICES } from '@/lib/volcengine/voiceMapping';
import { useSession } from 'next-auth/react';

interface TTSContextType {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  isCustomVoice: boolean;
  availableVoices: typeof STANDARD_VOICES;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

const LS_TTS_VOICE_KEY = 'tts-voice';
const LS_TTS_SPEED_KEY = 'tts-speed';

export function TTSContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedVoice, setSelectedVoiceState] = useState<string>('BV005_streaming');
  const [isCustomVoice, setIsCustomVoice] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.00);
  const { data: session } = useSession();

  // Load saved preferences on mount
  useEffect(() => {
    // Load saved voice
    const savedVoice = localStorage.getItem(LS_TTS_VOICE_KEY);
    if (savedVoice && Object.values(STANDARD_VOICES).some(v => v.id === savedVoice)) {
      setSelectedVoiceState(savedVoice);
    }

    // Load saved speed
    const savedSpeed = localStorage.getItem(LS_TTS_SPEED_KEY);
    if (savedSpeed) {
      const speed = parseFloat(savedSpeed);
      if (!isNaN(speed) && speed >= 0.5 && speed <= 2.0) {
        setPlaybackSpeedState(speed);
      }
    }
  }, []);

  const setSelectedVoice = useCallback(async (voice: string) => {
    // Only allow setting standard voices (not custom voices)
    if (voice.startsWith('S_')) {
      setIsCustomVoice(true);
      return;
    }
    
    setSelectedVoiceState(voice);
    setIsCustomVoice(false);
    localStorage.setItem(LS_TTS_VOICE_KEY, voice);
    
    // Save to database if user is logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/user/voice', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId: voice }),
        });
      } catch (error) {
        console.error('Failed to save voice preference:', error);
      }
    }
  }, [session?.user?.id]);

  const setPlaybackSpeed = useCallback(async (speed: number) => {
    // Clamp speed to valid range
    const clampedSpeed = Math.max(0.5, Math.min(2.0, speed));
    setPlaybackSpeedState(clampedSpeed);
    localStorage.setItem(LS_TTS_SPEED_KEY, clampedSpeed.toString());

    // Save to database if user is logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/user/tts-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playbackSpeed: clampedSpeed }),
        });
      } catch (error) {
        console.error('Failed to save TTS settings:', error);
      }
    }
  }, [session?.user?.id]);

  const value = {
    selectedVoice,
    setSelectedVoice,
    isCustomVoice,
    availableVoices: STANDARD_VOICES,
    playbackSpeed,
    setPlaybackSpeed,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}

export function useTTSContext() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTSContext must be used within a TTSContextProvider');
  }
  return context;
}