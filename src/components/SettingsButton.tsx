'use client';

import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { Menu } from 'lucide-react';

interface SettingsButtonProps {
  onPress: () => void;
  className?: string;
}

export function SettingsButton({ onPress, className = '' }: SettingsButtonProps) {
  return (
    <ButtonNaked
      onPress={onPress}
      className={`rounded-full p-2 transition-colors hover:bg-foreground/5 ${className}`}
      aria-label="Open settings">
      <Menu className="h-6 w-6 stroke-foreground" />
    </ButtonNaked>
  );
}
