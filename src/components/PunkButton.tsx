'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PunkButtonProps {
  isPunked: boolean;
  onPunk: () => void;
  disabled?: boolean;
  className?: string;
}

export default function PunkButton({ isPunked, onPunk, disabled, className = '' }: PunkButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!disabled && !isAnimating) {
      setIsAnimating(true);
      onPunk();
      setTimeout(() => setIsAnimating(false), 800);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center
        px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider
        transition-all duration-300 transform
        ${isPunked 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.span
        initial={false}
        animate={isAnimating ? {
          rotate: [0, -10, 10, -10, 10, 0],
          scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
        } : {}}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-1.5"
      >
        {isPunked ? (
          <>
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>PUNKED</span>
            <motion.span
              animate={{ 
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"
            />
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>PUNK IT</span>
          </>
        )}
      </motion.span>
    </motion.button>
  );
}