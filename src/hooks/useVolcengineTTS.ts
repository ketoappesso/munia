'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS'; // Fallback to browser TTS

interface UseVolcengineTTSOptions {
  voice?: 'BV001' | 'BV002' | 'BV003' | 'BV004' | 'BV005';
  speed?: number;
  volume?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onProgress?: (progress: number) => void;
  fallbackToBrowser?: boolean; // Use browser TTS if Volcengine fails
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
  
  // Fallback to browser TTS
  const browserTTS = useTTS(options);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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

    try {
      // Fetch synthesized audio from API
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: options.voice?.replace('_streaming', '') || 'BV001', // Remove _streaming suffix if present
          speed: options.speed || 1.0,
          volume: options.volume || 1.0,
          pitch: options.pitch || 1.0,
          encoding: 'mp3',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // If Volcengine fails and fallback is enabled, use browser TTS
        if (options.fallbackToBrowser !== false && result.fallback) {
          console.log('Falling back to browser TTS');
          setIsLoading(false);
          browserTTS.speak(text, onCharacter, textLength);
          setIsPlaying(browserTTS.isPlaying);
          return;
        }
        
        throw new Error(result.error || 'Failed to synthesize speech');
      }

      // Create audio element
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(`data:audio/mp3;base64,${result.audio}`);
      audioRef.current = audio;

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
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        
        // Try fallback to browser TTS
        if (options.fallbackToBrowser !== false) {
          console.log('Audio error, falling back to browser TTS');
          browserTTS.speak(text, onCharacter, textLength);
        }
      };

      // Start playback
      await audio.play();
      
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
        console.log('Error occurred, falling back to browser TTS');
        browserTTS.speak(text, onCharacter, textLength);
        setIsPlaying(browserTTS.isPlaying);
      }
    }
  }, [options, browserTTS]);

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

  return {
    speak,
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