'use client';

import { MenuBar } from '@/components/MenuBar';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import React from 'react';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="md:flex md:justify-center md:gap-2">
        <MenuBar />
        <ResponsiveContainer className="pb-20 md:pb-4">{children}</ResponsiveContainer>
        <FloatingActionButton />
      </div>
    </>
  );
}