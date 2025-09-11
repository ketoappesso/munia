'use client';

import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';

export default function AIControlFab({ visible = true }: { visible?: boolean }) {
  const router = useRouter();
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => router.push('/ai/control')}
      title="AI 控制"
      aria-label="AI 控制"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-6"
    >
      <Bot className="h-6 w-6" />
    </button>
  );
}

