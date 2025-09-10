'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePunk } from '@/contexts/PunkContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export default function PunkIndicator() {
  const { isPunkedActive, punkedByUsername, punkedByUserPhoto, clearPunkedVoice } = usePunk();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on a profile page
  const isProfilePage = pathname && /^\/[^\/]+$/.test(pathname) && !pathname.startsWith('/feed') && !pathname.startsWith('/messages');

  // Auto-hide logic for non-profile pages
  useEffect(() => {
    // Don't auto-hide on profile pages
    if (isProfilePage) {
      setIsVisible(true);
      return;
    }

    if (isPunkedActive) {
      setIsVisible(true);
      
      // Clear any existing timer
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Set timer to hide after 1 second
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1000);

      // Set up event listeners for user interaction
      const handleUserInteraction = () => {
        setIsVisible(false);
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
      };

      window.addEventListener('click', handleUserInteraction);
      window.addEventListener('scroll', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);

      return () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('scroll', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, [isPunkedActive, isProfilePage]);

  // Don't render on profile pages - ProfilePunkIndicator will be used instead
  if (isProfilePage || !isPunkedActive || !punkedByUsername || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-2">
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
            
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg 
                className="w-5 h-5" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>
            <span className="text-sm font-bold">
              Using {punkedByUsername}'s voice
            </span>
          </div>
          
          <button
            onClick={clearPunkedVoice}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Stop using this voice"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}