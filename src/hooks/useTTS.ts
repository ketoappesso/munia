'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export function useTTS(options: UseTTSOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        // Filter for Chinese voices - prioritize zh-CN
        const chineseVoices = availableVoices.filter(voice => 
          voice.lang.includes('zh-CN') || 
          voice.lang.includes('zh-TW') || 
          voice.lang.includes('zh-HK') ||
          voice.lang.includes('zh')
        );
        setVoices(chineseVoices.length > 0 ? chineseVoices : availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // Cleanup: Cancel any ongoing speech when component unmounts
      return () => {
        if (window.speechSynthesis.speaking) {
          console.log('Cleaning up browser TTS on unmount');
          window.speechSynthesis.cancel();
        }
      };
    }
  }, []);

  const speak = useCallback((text: string, onCharacter?: (charIndex: number) => void, textLength?: number) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech silently
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice (prefer Chinese voice)
    // Priority: zh-CN > zh-TW > zh-HK > any zh
    const chineseVoice = voices.find(voice => voice.lang === 'zh-CN' || voice.lang.startsWith('zh-CN')) ||
                        voices.find(voice => voice.lang === 'zh-TW' || voice.lang.startsWith('zh-TW')) ||
                        voices.find(voice => voice.lang === 'zh-HK' || voice.lang.startsWith('zh-HK')) ||
                        voices.find(voice => voice.lang.includes('zh'));
    
    if (chineseVoice) {
      utterance.voice = chineseVoice;
      utterance.lang = 'zh-CN'; // Force Chinese language
      console.log('Using Chinese voice:', chineseVoice.name, chineseVoice.lang);
    } else {
      // Fallback: set language to Chinese even without specific voice
      utterance.lang = 'zh-CN';
      console.log('No Chinese voice found, using default with zh-CN language');
    }

    // Set speech parameters
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Track character position for typewriter effect
    let startTime: number;
    let estimatedDuration: number;
    const totalChars = textLength || text.length;
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      options.onStart?.();
      startTime = Date.now();
      
      // Estimate speech duration based on character count and rate
      // Chinese typically ~150-200 chars/min at normal speed
      const charsPerSecond = (utterance.rate * 3); 
      estimatedDuration = (totalChars / charsPerSecond) * 1000;
      
      // Start typewriter effect synchronized with speech
      if (onCharacter) {
        const updateProgress = () => {
          if (!window.speechSynthesis.speaking) {
            // Speech ended
            onCharacter(totalChars - 1);
            return;
          }
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / estimatedDuration, 1);
          const currentChar = Math.floor(progress * totalChars);
          
          if (currentChar < totalChars) {
            onCharacter(currentChar);
            requestAnimationFrame(updateProgress);
          } else {
            onCharacter(totalChars - 1);
          }
        };
        
        requestAnimationFrame(updateProgress);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      options.onEnd?.();
      if (onCharacter) {
        // Ensure all text is shown
        onCharacter(text.length);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
      options.onPause?.();
    };

    utterance.onresume = () => {
      setIsPaused(false);
      options.onResume?.();
    };

    utterance.onerror = (event) => {
      // Only log actual errors, not interruptions from navigation or new TTS requests
      if (event.error !== 'interrupted') {
        console.error('TTS Error:', event);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices, options]);

  const pause = useCallback(() => {
    if (isSupported && isPlaying && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isPlaying && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported, isPlaying, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isSupported,
    voices,
  };
}