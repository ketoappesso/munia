'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, Loader2 } from 'lucide-react';
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
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  // Calculate estimated time
  useEffect(() => {
    if (duration && showTimer && !isPlaying) {
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      setEstimatedTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    } else if (!isPlaying) {
      setEstimatedTime('');
    }
  }, [duration, showTimer, isPlaying]);

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
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Timer display (before play) */}
      {showTimer && estimatedTime && !isPlaying && (
        <div className="animate-fadeIn rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {estimatedTime}
        </div>
      )}

      {/* Play/Pause button */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all',
          sizeClasses[size],
          isLoading && 'cursor-wait',
          !isLoading && 'hover:bg-gray-100 active:scale-95',
          isPlaying && !isPaused && 'bg-primary text-white hover:bg-primary-accent',
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
            <Play className={iconSizeClasses[size]} />
          ) : (
            <Pause className={iconSizeClasses[size]} />
          )
        ) : (
          <Volume2 className={iconSizeClasses[size]} />
        )}

        {/* Progress indicator */}
        {isPlaying && !isLoading && progress > 0 && (
          <div
            className="absolute inset-0 rounded-full bg-primary/20"
            style={{
              clipPath: `inset(0 ${100 - progress * 100}% 0 0)`,
            }}
          />
        )}
      </button>

      {/* Fallback indicator */}
      {isFallback && (
        <span className="text-xs text-gray-500" title="Using browser TTS">
          (Browser)
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
        'inline-flex h-5 w-5 items-center justify-center rounded-full transition-all',
        isLoading && 'cursor-wait',
        !isLoading && 'hover:bg-gray-100 active:scale-95',
        isPlaying && 'bg-primary text-white hover:bg-primary-accent'
      )}
      title={isPlaying ? 'Stop' : 'Play'}>
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
    </button>
  );
}