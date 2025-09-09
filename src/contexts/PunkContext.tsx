'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PunkContextType {
  punkedVoiceId: string | null;
  punkedByUserId: string | null;
  punkedByUsername: string | null;
  setPunkedVoice: (voiceId: string | null, userId: string | null, username: string | null) => void;
  isPunkedActive: boolean;
  clearPunkedVoice: () => void;
}

const PunkContext = createContext<PunkContextType | undefined>(undefined);

export function PunkProvider({ children }: { children: ReactNode }) {
  const [punkedVoiceId, setPunkedVoiceId] = useState<string | null>(null);
  const [punkedByUserId, setPunkedByUserId] = useState<string | null>(null);
  const [punkedByUsername, setPunkedByUsername] = useState<string | null>(null);

  const setPunkedVoice = useCallback((voiceId: string | null, userId: string | null, username: string | null) => {
    setPunkedVoiceId(voiceId);
    setPunkedByUserId(userId);
    setPunkedByUsername(username);
  }, []);

  const clearPunkedVoice = useCallback(() => {
    setPunkedVoiceId(null);
    setPunkedByUserId(null);
    setPunkedByUsername(null);
  }, []);

  return (
    <PunkContext.Provider 
      value={{
        punkedVoiceId,
        punkedByUserId,
        punkedByUsername,
        setPunkedVoice,
        isPunkedActive: !!punkedVoiceId,
        clearPunkedVoice,
      }}
    >
      {children}
    </PunkContext.Provider>
  );
}

export function usePunk() {
  const context = useContext(PunkContext);
  if (context === undefined) {
    throw new Error('usePunk must be used within a PunkProvider');
  }
  return context;
}