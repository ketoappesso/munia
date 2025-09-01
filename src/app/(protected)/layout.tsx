'use client';

import { MenuBar } from '@/components/MenuBar';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import React, { useState, useCallback } from 'react';
import { SettingsDrawer } from '@/components/SettingsDrawer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="md:flex md:justify-center md:gap-2">
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
