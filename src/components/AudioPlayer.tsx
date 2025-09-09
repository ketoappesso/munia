'use client';

import React, { useCallback } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AudioPlayerProps {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  progress?: number;
  duration?: number; // in seconds
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  showTimer?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isFallback?: boolean;
}

export function AudioPlayer({
  isPlaying,
  isPaused,
  isLoading,
  progress = 0,
  duration,
  onPlay,
  onPause,
  onStop,
  showTimer = true,
  className,
  size = 'md',
  isFallback = false,
}: AudioPlayerProps) {
  const handleClick = useCallback(() => {
    if (isLoading) return;
    
    if (isPlaying) {
      if (isPaused) {
        onPlay(); // Resume
      } else {
        onPause(); // Pause
      }
    } else {
      onPlay(); // Start
    }
  }, [isPlaying, isPaused, isLoading, onPlay, onPause]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Stylish Play/Pause button matching Appesso design */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-200',
          sizeClasses[size],
          isLoading && 'cursor-wait',
          !isLoading && !isPlaying && 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110',
          !isLoading && isPlaying && !isPaused && 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-110',
          !isLoading && isPlaying && isPaused && 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg hover:shadow-xl hover:scale-110',
          'transform active:scale-95',
          className
        )}
        title={
          isLoading ? 'Loading...' :
          isPlaying && !isPaused ? 'Pause' :
          isPlaying && isPaused ? 'Resume' :
          'Play'
        }>
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizeClasses[size])} />
        ) : isPlaying ? (
          isPaused ? (
            <Play className={cn(iconSizeClasses[size], 'fill-current')} />
          ) : (
            <Pause className={cn(iconSizeClasses[size], 'fill-current')} />
          )
        ) : (
          <Play className={cn(iconSizeClasses[size], 'fill-current')} />
        )}

        {/* Animated progress ring */}
        {isPlaying && !isLoading && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90 transform"
            viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              opacity="0.2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${progress * 283} 283`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
        )}
      </button>

      {/* Fallback indicator - made more subtle */}
      {isFallback && (
        <span className="text-xs text-gray-400 italic">
          Browser
        </span>
      )}
    </div>
  );
}

// Mini version for inline use
export function AudioPlayerMini({
  isPlaying,
  onToggle,
  isLoading = false,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 transform',
        isLoading && 'cursor-wait',
        !isLoading && !isPlaying && 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow hover:shadow-md hover:scale-110',
        !isLoading && isPlaying && 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow hover:shadow-md hover:scale-110',
        'active:scale-95'
      )}
      title={isPlaying ? 'Stop' : 'Play'}>
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-3 w-3 fill-current" />
      ) : (
        <Play className="h-3 w-3 fill-current" />
      )}
    </button>
  );
}