'use client';

import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useDialogs } from '@/hooks/useDialogs';
import { LogOutCircle } from '@/svg_components';
import { ButtonNaked } from './ui/ButtonNaked';

export function LogoutButton() {
  const { confirm } = useDialogs();

  const onLogoutClick = useCallback(() => {
    confirm({
      title: 'Confirm Logout',
      message: 'Do you really wish to logout?',
      onConfirm: () => signOut({ callbackUrl: '/' }),
    });
  }, [confirm]);

  // Styled to match the existing design convention in ProfileHeader
  return (
    <ButtonNaked
      className="rounded-full border border-foreground/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
      onPress={onLogoutClick}>
      <LogOutCircle className="mr-2 inline h-4 w-4" />
      Logout
    </ButtonNaked>
  );
}
