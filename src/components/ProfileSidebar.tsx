'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut, Wallet, Edit, Coins } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useDialogs } from '@/hooks/useDialogs';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
  username: string;
}

export function ProfileSidebar({ 
  isOpen, 
  onClose, 
  isOwnProfile,
  username
}: ProfileSidebarProps) {
  const router = useRouter();
  const { confirm } = useDialogs();
  const { data: wallet } = useWalletQuery();

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = useCallback(() => {
    // Close sidebar first
    onClose();
    
    // Then show confirm dialog
    setTimeout(() => {
      confirm({
        title: 'Confirm Logout',
        message: 'Do you really wish to logout?',
        onConfirm: () => signOut({ callbackUrl: '/' }),
      });
    }, 300); // Small delay to allow sidebar animation to complete
  }, [confirm, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-background shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Profile Navigation">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-semibold text-foreground">Menu</h2>
              <ButtonNaked
                onPress={onClose}
                className="rounded-full p-1 hover:bg-foreground/5"
                aria-label="Close navigation">
                <X className="h-6 w-6 stroke-foreground" />
              </ButtonNaked>
            </div>

            {/* Content */}
            <div className="flex h-[calc(100%-72px)] flex-col">
              <div className="flex-1 space-y-2 p-4">
                {/* Profile Actions for own profile */}
                {isOwnProfile && (
                  <>
                    <ButtonNaked
                      onPress={() => handleNavigation('/edit-profile')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Edit className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Edit Profile</span>
                    </ButtonNaked>

                    <ButtonNaked
                      onPress={() => handleNavigation('/wallet')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Wallet className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Wallet</span>
                    </ButtonNaked>

                    <ButtonNaked
                      onPress={() => handleNavigation('/settings')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Settings className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Settings</span>
                    </ButtonNaked>

                    {/* Divider */}
                    <div className="my-4 border-t border-border" />
                  </>
                )}

                {/* Wallet Section - Same style as NavigationSidebar */}
                {isOwnProfile && (
                  <div className="mb-4">
                    <ButtonNaked
                      onPress={() => handleNavigation('/wallet')}
                      className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 transition-all hover:from-purple-500/20 hover:to-blue-500/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">我的钱包</p>
                          <p className="text-xs text-muted-foreground">点击管理资产</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="text-lg font-bold text-foreground">
                            {wallet?.apeBalance?.toFixed(0) || '0'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">APE</p>
                      </div>
                    </ButtonNaked>
                  </div>
                )}

                {/* Navigation Links */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Navigation</h3>
                  
                  <ButtonNaked
                    onPress={() => handleNavigation('/feed')}
                    className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <span className="text-foreground">Feed</span>
                  </ButtonNaked>

                  <ButtonNaked
                    onPress={() => handleNavigation('/messages')}
                    className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <span className="text-foreground">Messages</span>
                  </ButtonNaked>

                  <ButtonNaked
                    onPress={() => handleNavigation('/discover')}
                    className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <span className="text-foreground">Discover People</span>
                  </ButtonNaked>
                </div>
              </div>

              {/* Logout Button - Only show for own profile */}
              {isOwnProfile && (
                <div className="border-t border-border p-4">
                  <ButtonNaked
                    onPress={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </ButtonNaked>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
