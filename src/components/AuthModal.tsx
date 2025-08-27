'use client';

import SvgClose from '@/svg_components/Close';
import { UserAuthForm } from '@/app/(auth)/UserAuthForm';
import { useCallback, useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  const handleModeToggle = useCallback(() => {
    setMode(mode === 'login' ? 'register' : 'login');
  }, [mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-background p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted">
            <SvgClose className="h-5 w-5" />
          </button>
        </div>

        <UserAuthForm mode={mode} />

        <div className="mt-4 text-center">
          <button type="button" onClick={handleModeToggle} className="text-primary-accent hover:underline">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
