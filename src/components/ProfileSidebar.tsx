'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut, Wallet, Edit, Coins, QrCode, Home, Camera, Smartphone, Gamepad2 } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useDialogs } from '@/hooks/useDialogs';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      
      // Add styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleQRScanner = useCallback(() => {
    // Close sidebar first
    onClose();
    // TODO: Implement QR scanner functionality
    console.log('Opening QR Scanner...');
    // You can implement the actual QR scanner here
    // For now, just log the action
  }, [onClose]);

  const handleSelfieCapture = useCallback(() => {
    // Close sidebar first
    onClose();
    // TODO: Implement selfie capture functionality
    console.log('Opening Selfie Camera...');
    // You can implement the actual camera capture here
    // For now, just log the action
  }, [onClose]);

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
        title: t('nav.confirmLogout'),
        message: t('nav.confirmLogoutMessage'),
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-80 bg-background shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Profile Navigation">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-semibold text-foreground">{t('nav.navigation')}</h2>
              <ButtonNaked
                onPress={onClose}
                className="rounded-full p-1 hover:bg-foreground/5"
                aria-label="Close navigation">
                <X className="h-6 w-6 stroke-foreground" />
              </ButtonNaked>
            </div>

            {/* Content */}
            <div className="flex h-[calc(100%-72px)] flex-col overflow-hidden">
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {/* Profile Actions for own profile */}
                {isOwnProfile && (
                  <>
                    <ButtonNaked
                      onPress={() => handleNavigation('/edit-profile')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Edit className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">{t('nav.editProfile')}</span>
                    </ButtonNaked>

                    <ButtonNaked
                      onPress={() => handleNavigation('/settings')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Settings className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">{t('nav.settings')}</span>
                    </ButtonNaked>

                    {/* Divider */}
                    <div className="my-4 border-t border-border" />
                  </>
                )}

                {/* Wallet Section - Same style as NavigationSidebar */}
                {isOwnProfile && (
                  <>
                    <div className="mb-4">
                      <ButtonNaked
                        onPress={() => handleNavigation('/wallet')}
                        className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 transition-all hover:from-purple-500/20 hover:to-blue-500/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                            <Wallet className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t('nav.myWallet')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.clickToManage')}</p>
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

                    {/* My Space Section with Selfie Button */}
                    <div className="mb-4">
                      <ButtonNaked
                        onPress={handleSelfieCapture}
                        className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-green-500/10 to-teal-500/10 p-4 transition-all hover:from-green-500/20 hover:to-teal-500/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500">
                            <Home className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t('nav.mySpace')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.takeSelfie')}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Camera className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                          </div>
                        </div>
                      </ButtonNaked>
                    </div>

                    {/* My Device Section with QR Scanner */}
                    <div className="mb-4">
                      <ButtonNaked
                        onPress={handleQRScanner}
                        className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 transition-all hover:from-orange-500/20 hover:to-red-500/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
                            <Smartphone className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t('nav.myDevice')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.scanDeviceCode')}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <QrCode className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                          </div>
                        </div>
                      </ButtonNaked>
                    </div>

                    {/* My Games Section */}
                    <div className="mb-4">
                      <ButtonNaked
                        onPress={() => handleNavigation('/games')}
                        className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 transition-all hover:from-pink-500/20 hover:to-purple-500/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
                            <Gamepad2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t('nav.myGames')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.enterGameCenter')}</p>
                          </div>
                        </div>
                      </ButtonNaked>
                    </div>
                  </>
                )}

                {/* Navigation Links */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">{t('nav.navigation')}</h3>
                  
                  <ButtonNaked
                    onPress={() => handleNavigation('/feed')}
                    className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <span className="text-foreground">{t('nav.feed')}</span>
                  </ButtonNaked>

                  <ButtonNaked
                    onPress={() => handleNavigation('/messages')}
                    className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <span className="text-foreground">{t('nav.messages')}</span>
                  </ButtonNaked>

                  <ButtonNaked
                    onPress={() => handleNavigation('/discover')}
                    className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <span className="text-foreground">{t('nav.discoverPeople')}</span>
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
                    <span className="font-medium">{t('nav.logout')}</span>
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
