'use client';

import React from 'react';

// The messages layout is now simplified - the parent protected layout handles the conditional logic
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
