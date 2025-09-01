'use client';

import { MenuBar } from '@/components/MenuBar';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import React, { useState, useCallback } from 'react';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if we're in a chat conversation page
  const isChatPage = pathname?.match(/^\/messages\/[^/]+$/);

  const onSettingsClose = useCallback(() => setIsSettingsOpen(false), [setIsSettingsOpen]);

  if (isChatPage) {
    // For chat pages, render only children without any wrapper
    return <>{children}</>;
  }

  return (
    <>
      <div className="md:flex md:justify-center md:gap-2">
        <MenuBar />

        <ResponsiveContainer className="pb-20 md:pb-4">{children}</ResponsiveContainer>
        {/* <FloatingActionButton /> */}
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={onSettingsClose}
      />
    </>
  );
}
