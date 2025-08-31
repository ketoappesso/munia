'use client';

import { MenuBar } from '@/components/MenuBar';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import React, { useState, useCallback } from 'react';
import { SettingsButton } from '@/components/SettingsButton';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { useScroll } from '@/hooks/useScroll';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollY = useScroll();

  return (
    <>
      <div className="md:flex md:justify-center md:gap-2">
        {/* Settings Button - Top Left */}
        <div
          className="fixed left-4 top-4 z-40 transition-transform duration-300 md:left-6 md:top-6"
          style={scrollY > 50 ? { transform: 'translateY(-100%)' } : undefined}>
          <SettingsButton onPress={() => setIsSettingsOpen(true)} />
        </div>

        <MenuBar />

        <ResponsiveContainer className="pb-20 md:pb-4">{children}</ResponsiveContainer>
        {/* <FloatingActionButton /> */}
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={useCallback(() => setIsSettingsOpen(false), [setIsSettingsOpen])}
      />
    </>
  );
}
