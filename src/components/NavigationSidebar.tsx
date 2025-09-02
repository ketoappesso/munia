'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Coins, LogOut, Edit, Settings, QrCode, Home, Camera, Smartphone, Gamepad2 } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useDialogs } from '@/hooks/useDialogs';
import { useCallback, useState, useEffect } from 'react';

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: 'feed' | 'messages';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function NavigationSidebar({ 
  isOpen, 
  onClose, 
  currentPage = 'feed',
  activeTab, 
  onTabChange 
}: NavigationSidebarProps) {
  const router = useRouter();
  const { data: wallet } = useWalletQuery();
  const { data: session } = useSession();
  const { confirm } = useDialogs();
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

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    onClose();
  };

  const feedTabs = [
    { id: 'following', label: '关注', description: 'View posts from people you follow' },
    { id: 'discover', label: '发现', description: 'Explore new posts and people' },
    { id: 'tasks', label: '任务', description: 'View and manage your tasks' },
  ];

  const messageTabs = [
    { id: 'messages', label: '信息', description: 'View your messages' },
    { id: 'notifications', label: '提醒', description: 'View your notifications' },
  ];

  const currentTabs = currentPage === 'feed' ? feedTabs : messageTabs;

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
            aria-label="Navigation">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-semibold text-foreground">Navigation</h2>
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
              {/* Current Page Tabs */}
              {onTabChange && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {currentPage === 'feed' ? 'Feed Tabs' : 'Message Tabs'}
                  </h3>
                  {currentTabs.map((tab) => (
                    <ButtonNaked
                      key={tab.id}
                      onPress={() => handleTabClick(tab.id)}
                      className={`mb-2 flex w-full flex-col items-start rounded-lg p-3 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}>
                      <span className="text-lg font-medium">{tab.label}</span>
                      <span className="text-sm text-muted-foreground">{tab.description}</span>
                    </ButtonNaked>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="my-4 border-t border-border" />

              {/* Wallet Section */}
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
                      <p className="text-sm font-medium text-foreground">我的空间</p>
                      <p className="text-xs text-muted-foreground">拍摄自拍</p>
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
                      <p className="text-sm font-medium text-foreground">我的设备</p>
                      <p className="text-xs text-muted-foreground">扫描设备码</p>
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
                      <p className="text-sm font-medium text-foreground">我的游戏</p>
                      <p className="text-xs text-muted-foreground">进入游戏中心</p>
                    </div>
                  </div>
                </ButtonNaked>
              </div>

              {/* Navigation Links */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Pages</h3>
                
                <ButtonNaked
                  onPress={() => handleNavigation('/feed')}
                  className={`mb-2 flex w-full items-center rounded-lg p-3 transition-colors ${
                    currentPage === 'feed' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}>
                  <span className="text-foreground">Feed</span>
                </ButtonNaked>

                <ButtonNaked
                  onPress={() => handleNavigation('/messages')}
                  className={`mb-2 flex w-full items-center rounded-lg p-3 transition-colors ${
                    currentPage === 'messages' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}>
                  <span className="text-foreground">Messages</span>
                </ButtonNaked>

                <ButtonNaked
                  onPress={() => handleNavigation('/discover')}
                  className="mb-2 flex w-full items-center rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <span className="text-foreground">Discover People</span>
                </ButtonNaked>

                {/* Divider */}
                <div className="my-4 border-t border-border" />

                {/* Profile Actions */}
                {session?.user && (
                  <>
                    <ButtonNaked
                      onPress={() => handleNavigation('/edit-profile')}
                      className="mb-2 flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Edit className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Edit Profile</span>
                    </ButtonNaked>

                    <ButtonNaked
                      onPress={() => handleNavigation('/settings')}
                      className="mb-2 flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Settings className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Settings</span>
                    </ButtonNaked>
                  </>
                )}
              </div>
            </div>

            {/* Logout Button */}
            {session?.user && (
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
