'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useVolcengineTTS } from '@/hooks/useVolcengineTTS';

interface PunkAIMessageProps {
  content: string;
  voiceId?: string;
  isOwn?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function PunkAIMessage({ 
  content, 
  voiceId = 'BV001_streaming',
  isOwn = false,
  onComplete,
  className
}: PunkAIMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const hasStartedRef = useRef(false);

  const { 
    speak, 
    isPlaying, 
    isLoading,
  } = useVolcengineTTS({
    voice: voiceId,
    speed: 1.1,
    onEnd: () => {
      setIsCompleted(true);
      setDisplayedText(content);
      onComplete?.();
    },
  });

  useEffect(() => {
    // Start TTS and character display only once
    if (!hasStartedRef.current && content) {
      hasStartedRef.current = true;
      
      // Start playback with character-by-character reveal
      const textLength = content.length;
      speak(content, (charIndex) => {
        // Update displayed text character by character
        setDisplayedText(content.slice(0, charIndex + 1));
      }, textLength);
    }
  }, [content, speak]);

  return (
    <div
      className={cn(
        'relative max-w-[70%] rounded-2xl px-4 py-2',
        isOwn
          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
          : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
        className
      )}
    >
      <p className="whitespace-pre-wrap break-words text-sm">
        {displayedText}
      </p>
    </div>
  );
}