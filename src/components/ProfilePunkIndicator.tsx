'use client';

import { motion } from 'framer-motion';
import { usePunk } from '@/contexts/PunkContext';
import Image from 'next/image';

export default function ProfilePunkIndicator() {
  const { isPunkedActive, punkedByUsername, punkedByUserPhoto, clearPunkedVoice } = usePunk();

  if (!isPunkedActive || !punkedByUsername) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full shadow-lg"
    >
      {/* User Avatar */}
      {punkedByUserPhoto && (
        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/30">
          <Image
            src={punkedByUserPhoto}
            alt={punkedByUsername}
            width={24}
            height={24}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Star Icon */}
      <motion.div
        animate={{ 
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg 
          className="w-4 h-4" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </motion.div>
      
      {/* Text */}
      <span className="text-xs font-bold">
        Using {punkedByUsername}'s voice
      </span>
      
      {/* Close Button */}
      <button
        onClick={clearPunkedVoice}
        className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
        title="Stop using this voice"
      >
        <svg 
          className="w-3.5 h-3.5" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}