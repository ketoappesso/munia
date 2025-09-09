'use client';

import { CreatePostModalContextProvider } from '@/contexts/CreatePostModalContext';
import { DialogsContextProvider } from '@/contexts/DialogsContext';
import { ReactQueryProvider } from '@/contexts/ReactQueryProvider';
import { ShouldAnimateContextProvider } from '@/contexts/ShouldAnimateContext';
import { ThemeContextProvider } from '@/contexts/ThemeContext';
import { ToastContextProvider } from '@/contexts/ToastContext';
import { VisualMediaModalContextProvider } from '@/contexts/VisualMediaModalContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TTSContextProvider } from '@/contexts/TTSContext';
import { PunkProvider } from '@/contexts/PunkContext';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import React from 'react';
import { OfflineQueueProcessor } from './OfflineQueueProcessor';
import PunkIndicator from './PunkIndicator';

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <ThemeContextProvider>
      <LanguageProvider>
        <ToastContextProvider>
          <ReactQueryProvider>
            <SessionProvider session={session}>
              <PunkProvider>
                <TTSContextProvider>
                  <DialogsContextProvider>
                    <VisualMediaModalContextProvider>
                      <CreatePostModalContextProvider>
                        <ShouldAnimateContextProvider>
                          <OfflineQueueProcessor />
                          <PunkIndicator />
                          {children}
                        </ShouldAnimateContextProvider>
                      </CreatePostModalContextProvider>
                    </VisualMediaModalContextProvider>
                  </DialogsContextProvider>
                </TTSContextProvider>
              </PunkProvider>
            </SessionProvider>
          </ReactQueryProvider>
        </ToastContextProvider>
      </LanguageProvider>
    </ThemeContextProvider>
  );
}
