'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS'; // Fallback to browser TTS
import { usePunk } from '@/contexts/PunkContext';
import { useTTSContext } from '@/contexts/TTSContext';

interface UseVolcengineTTSOptions {
  voice?: string | null; // Custom voice ID (S_xxx) or null for browser TTS
  speed?: number;
  volume?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onProgress?: (progress: number) => void;
  fallbackToBrowser?: boolean; // Use browser TTS if Volcengine fails (default true)
}

export function useVolcengineTTS(options: UseVolcengineTTSOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  // Get punk context
  const { punkedVoiceId, isPunkedActive } = usePunk();

  // Get global TTS settings
  const { playbackSpeed } = useTTSContext();

  // Fallback to browser TTS with global speed - don't pass callbacks to avoid duplicate triggers
  const browserTTS = useTTS({
    speed: options.speed || playbackSpeed,
    // Don't pass callbacks here - we'll call them manually when needed
  });

  // Clean up on unmount - simplified to avoid interrupting playback
  useEffect(() => {
    return () => {
      // Clean up progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Clear reference but don't stop audio to avoid interruption
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(async (
    text: string, 
    onCharacter?: (charIndex: number) => void,
    textLength?: number
  ) => {
    if (!text) return;

    // Reset state
    setError(null);
    setIsLoading(true);
    setProgress(0);

    // Determine voice to use
    let voiceToUse = options.voice;

    // Use punked voice if active
    if (isPunkedActive && punkedVoiceId) {
      voiceToUse = punkedVoiceId;
    }

    console.log('[useVolcengineTTS] Voice selection:', {
      optionsVoice: options.voice,
      punkedVoiceId,
      isPunkedActive,
      voiceToUse,
      isCustom: voiceToUse?.startsWith('S_')
    });

    // If no custom voice, use browser TTS directly
    if (!voiceToUse || !voiceToUse.startsWith('S_')) {
      console.log('[useVolcengineTTS] No custom voice, using browser TTS');
      setIsLoading(false);
      options.onStart?.();
      browserTTS.speak(text, onCharacter, textLength);
      setIsPlaying(browserTTS.isPlaying);
      // Note: onEnd will be called by browserTTS internally
      return;
    }

    try {
      // Only call API for custom voices
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: voiceToUse,
          speed: options.speed || playbackSpeed || 1.0,
          volume: options.volume || 1.0,
          pitch: options.pitch || 1.0,
          encoding: 'mp3',
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('TTS API returned non-JSON response:', response.status, response.statusText);
        throw new Error('TTS API returned invalid response');
      }

      const result = await response.json();

      console.log('[useVolcengineTTS] TTS API response:', {
        status: response.status,
        success: result.success,
        hasAudio: !!result.audio,
        fallback: result.fallback,
        error: result.error
      });

      if (!response.ok || !result.success) {
        // If Volcengine fails and fallback is enabled, use browser TTS
        if (options.fallbackToBrowser !== false && result.fallback) {
          console.log('[useVolcengineTTS] API failed, falling back to browser TTS');
          setIsLoading(false);
          options.onStart?.();
          browserTTS.speak(text, onCharacter, textLength);
          setIsPlaying(browserTTS.isPlaying);
          return;
        }

        // If fallback is disabled, just show error
        setIsLoading(false);
        const errorMsg = result.error || 'Failed to synthesize speech';
        setError(errorMsg);
        options.onEnd?.(); // Reset UI state
        console.error('[useVolcengineTTS] API failed:', errorMsg);
        return;
      }

      // Clean up any existing audio before creating new one
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Debug audio data
      console.log('Audio data received:', {
        length: result.audio?.length,
        preview: result.audio?.substring(0, 100)
      });

      // Check if audio data is valid
      if (!result.audio || result.audio.length === 0) {
        throw new Error('No audio data received from API');
      }

      // Remove incorrect silence detection - //PkxAAAA is just a normal MP3 header pattern
      // The API returns valid audio data even when it starts with this pattern

      const audio = new Audio(`data:audio/mp3;base64,${result.audio}`);
      audioRef.current = audio;

      console.log('[useVolcengineTTS] Created audio element for custom voice');

      // Set up event handlers
      audio.onloadedmetadata = () => {
        setIsLoading(false);
        console.log('Audio metadata loaded, duration:', audio.duration);
        
        // Start progress tracking when metadata is loaded (we have duration)
        if (onCharacter && textLength && audio.duration > 0) {
          const duration = audio.duration * 1000; // Convert to milliseconds
          const startTime = Date.now();
          
          progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentChar = Math.floor(progress * textLength);
            
            setProgress(progress);
            onCharacter(currentChar);
            options.onProgress?.(progress);
            
            if (progress >= 1) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          }, 50); // Update every 50ms for smooth animation
        }
      };

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        options.onStart?.();
        
        // Fallback: if duration wasn't available in onloadedmetadata, try again
        if (onCharacter && textLength && !progressIntervalRef.current && audio.duration > 0) {
          const duration = audio.duration * 1000; // Convert to milliseconds
          const startTime = Date.now();
          
          progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentChar = Math.floor(progress * textLength);
            
            setProgress(progress);
            onCharacter(currentChar);
            options.onProgress?.(progress);
            
            if (progress >= 1) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          }, 50); // Update every 50ms for smooth animation
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(1);
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        if (onCharacter && textLength) {
          onCharacter(textLength - 1);
        }
        
        options.onEnd?.();
      };

      audio.onpause = () => {
        setIsPaused(true);
        options.onPause?.();
      };

      audio.onerror = (e) => {
        console.error('[useVolcengineTTS] Audio playback error:', e);
        const errorMsg = 'Failed to play custom voice audio';
        setError(errorMsg);
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);

        // Clean up the failed audio element
        if (audioRef.current) {
          audioRef.current.src = '';
          audioRef.current = null;
        }

        // Try fallback to browser TTS only if enabled
        if (options.fallbackToBrowser !== false) {
          console.log('[useVolcengineTTS] Audio error, falling back to browser TTS');
          options.onStart?.();
          browserTTS.speak(text, onCharacter, textLength);
        } else {
          console.log('[useVolcengineTTS] Audio error, fallback disabled');
          options.onEnd?.(); // Call onEnd to reset UI state
        }
      };

      // Start playback with better error handling
      try {
        await audio.play();
      } catch (playError) {
        // Handle play() interruption gracefully
        if (playError instanceof Error && playError.name === 'AbortError') {
          console.log('Playback was interrupted');
          // Don't fallback on AbortError as it's usually just user navigation
          setIsLoading(false);
          return;
        } else if (playError instanceof Error && playError.name === 'NotAllowedError') {
          console.log('Playback not allowed, user interaction required');
          setError('Please click play again to start audio');
          setIsLoading(false);
        } else {
          console.error('Unexpected playback error:', playError);
          // For unexpected errors, try browser TTS fallback
          if (options.fallbackToBrowser !== false) {
            console.log('Falling back to browser TTS due to playback error');
            options.onStart?.();
            browserTTS.speak(text, onCharacter, textLength);
            setIsPlaying(browserTTS.isPlaying);
          }
          setIsLoading(false);
        }
      }
      
      // Additional fallback: Use estimated duration if audio duration is still not available
      if (onCharacter && textLength && !progressIntervalRef.current) {
        console.log('Using estimated duration for typewriter effect');
        // Estimate: 3 characters per second for Chinese
        const estimatedDuration = (textLength / 3) * 1000; // milliseconds
        const startTime = Date.now();
        
        progressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / estimatedDuration, 1);
          const currentChar = Math.floor(progress * textLength);
          
          setProgress(progress);
          onCharacter(currentChar);
          options.onProgress?.(progress);
          
          if (progress >= 1) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        }, 50); // Update every 50ms for smooth animation
      }

    } catch (err) {
      console.error('TTS error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      
      // Try fallback to browser TTS
      if (options.fallbackToBrowser !== false) {
        console.log('[useVolcengineTTS] Error occurred, falling back to browser TTS');
        options.onStart?.();
        browserTTS.speak(text, onCharacter, textLength);
        setIsPlaying(browserTTS.isPlaying);
      } else {
        console.log('[useVolcengineTTS] Error occurred, fallback disabled');
        options.onEnd?.(); // Reset UI state
      }
    }
  }, [options, browserTTS, isPunkedActive, punkedVoiceId]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying && !isPaused) {
      audioRef.current.pause();
    } else if (browserTTS.isPlaying) {
      browserTTS.pause();
    }
  }, [isPlaying, isPaused, browserTTS]);

  const resume = useCallback(() => {
    if (audioRef.current && isPlaying && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      options.onResume?.();
    } else if (browserTTS.isPlaying && browserTTS.isPaused) {
      browserTTS.resume();
    }
  }, [isPlaying, isPaused, options, browserTTS]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    
    if (browserTTS.isPlaying) {
      browserTTS.stop();
    }
  }, [browserTTS]);

  // Simple play function for direct text-to-speech
  const playTTS = useCallback(async (text: string, voiceId?: string) => {
    // Use provided voice or default to standard voice
    const voice = voiceId || 'BV001_streaming';
    // Call speak with the voice option
    await speak(text, undefined, undefined);
  }, [speak]);

  return {
    speak,
    playTTS,
    pause,
    resume,
    stop,
    isPlaying: isPlaying || browserTTS.isPlaying,
    isPaused: isPaused || browserTTS.isPaused,
    isLoading,
    isSupported,
    error,
    progress,
    isFallback: !audioRef.current && browserTTS.isPlaying,
  };
}