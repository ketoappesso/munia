'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  LogOut, 
  Wallet, 
  Edit, 
  Coins, 
  QrCode, 
  Home, 
  Camera, 
  Smartphone, 
  Gamepad2, 
  Bot,
  Crown 
} from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useDialogs } from '@/hooks/useDialogs';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';
import { useSession } from 'next-auth/react';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import Link from 'next/link';
import { fileNameToUrl } from '@/lib/tos/fileNameToUrl';

interface UnifiedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: 'feed' | 'messages' | 'profile' | string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // Profile-specific props
  isOwnProfile?: boolean;
  username?: string;
  // Show/hide certain sections
  showTabs?: boolean;
  showNavigation?: boolean;
  showProfileActions?: boolean;
}

export function UnifiedSidebar({ 
  isOpen, 
  onClose,
  currentPage = 'feed',
  activeTab,
  onTabChange,
  isOwnProfile = true,
  username,
  showTabs = true,
  showNavigation = true,
  showProfileActions = true
}: UnifiedSidebarProps) {
  const router = useRouter();
  const { confirm } = useDialogs();
  const { data: wallet } = useWalletQuery();
  const { data: session } = useSession();
  const { data: user } = useUserQuery(session?.user?.id);
  
  // State for member status
  const [memberStatus, setMemberStatus] = useState<{ isApeLord: boolean } | null>(null);
  
  // Fetch member status
  useEffect(() => {
    if (isOwnProfile && session?.user) {
      console.log('Fetching member status for sidebar...');
      fetch('/api/pospal/member-info')
        .then(res => {
          console.log('Member status response status:', res.status);
          return res.ok ? res.json() : null;
        })
        .then(data => {
          console.log('Member status data:', data);
          if (data) {
            setMemberStatus({ isApeLord: data.isApeLord || false });
          } else {
            // If no data, default to false
            setMemberStatus({ isApeLord: false });
          }
        })
        .catch((error) => {
          console.error('Error fetching member status:', error);
          setMemberStatus({ isApeLord: false });
        });
    }
  }, [isOwnProfile, session]);

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
    onClose();
    console.log('Opening QR Scanner...');
  }, [onClose]);

  const handleSelfieCapture = useCallback(() => {
    onClose();
    console.log('Opening Selfie Camera...');
  }, [onClose]);

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

  const handleLogout = useCallback(() => {
    onClose();
    
    setTimeout(() => {
      confirm({
        title: 'Confirm Logout',
        message: 'Do you really wish to logout?',
        onConfirm: () => signOut({ callbackUrl: '/' }),
      });
    }, 300);
  }, [confirm, onClose]);

  // Tab configuration based on current page
  const getTabsForPage = (): Array<{id: string; label: string; description: string}> => {
    switch (currentPage) {
      case 'messages':
        return [];
      case 'feed':
        return [];
      default:
        return [];
    }
  };

  const currentTabs = getTabsForPage();

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
            aria-label="Menu">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
            </div>

            {/* Content */}
            <div className="flex h-[calc(100%-72px)] flex-col overflow-hidden">
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {/* User Profile Section */}
                {user && (
                  <div className="mb-6 flex justify-center">
                    <Link href={`/${user.username}`}>
                      <button
                        type="button"
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 transition-all duration-200 border-2 border-primary/20 hover:border-primary/30"
                        title="Profile"
                        onClick={onClose}>
                        {(() => {
                          const avatarUrl = fileNameToUrl(user.profilePhoto);
                          return avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={user.name || 'Profile'}
                              className="h-16 w-16 rounded-full object-cover ring-2 ring-white/50"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          );
                        })()}
                      </button>
                    </Link>
                  </div>
                )}

                {/* Profile Info */}
                {user && (
                  <div className="mb-4 text-center">
                    <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.bio && (
                      <p className="mt-1 text-xs text-foreground/80 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                )}

                {/* Current Page Tabs */}
                {showTabs && onTabChange && currentTabs.length > 0 && (
                  <>
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
                    <div className="my-4 border-t border-border" />
                  </>
                )}

                {/* Profile Actions */}
                {showProfileActions && isOwnProfile && (
                  <>
                    <ButtonNaked
                      onPress={() => handleNavigation('/edit-profile')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Edit className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Edit Profile</span>
                    </ButtonNaked>

                    <ButtonNaked
                      onPress={() => handleNavigation('/settings')}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <Settings className="h-5 w-5 text-foreground" />
                      <span className="text-foreground">Settings</span>
                    </ButtonNaked>

                    <div className="my-4 border-t border-border" />
                  </>
                )}

                {/* Wallet Section */}
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
                        <div className="flex items-center justify-end gap-1">
                          <p className="text-xs text-muted-foreground">APE</p>
                        </div>
                      </div>
                    </ButtonNaked>
                  </div>
                )}

                {/* My Space Section */}
                {isOwnProfile && (
                  <div className="mb-4">
                    <ButtonNaked
                      onPress={() => {
                        console.log('My Space clicked, memberStatus:', memberStatus);
                        // Always navigate to my-space
                        handleNavigation('/my-space');
                      }}
                      className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-green-500/10 to-teal-500/10 p-4 transition-all hover:from-green-500/20 hover:to-teal-500/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500">
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">我的空间</p>
                          <p className="text-xs text-muted-foreground">
                            {memberStatus?.isApeLord ? '门禁管理中心' : '升级猿佬会员'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        {memberStatus?.isApeLord ? (
                          <ButtonNaked
                            onPress={(e) => {
                              e.stopPropagation();
                              handleNavigation('/my-space/access-control/face-recording');
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors">
                            <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </ButtonNaked>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Crown className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                    </ButtonNaked>
                  </div>
                )}

                {/* My Device Section */}
                {isOwnProfile && (
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
                )}

                {/* My Games/Tools Section */}
                {isOwnProfile && (
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
                )}

                {/* AI Assistant Section */}
                {isOwnProfile && (
                  <div className="mb-4">
                    <ButtonNaked
                      onPress={() => handleNavigation('/messages/xiaoyuan_ai')}
                      className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 transition-all hover:from-cyan-500/20 hover:to-blue-500/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">AI 助手</p>
                          <p className="text-xs text-muted-foreground">智能对话助手</p>
                        </div>
                      </div>
                    </ButtonNaked>
                  </div>
                )}

              </div>

              {/* Logout Button */}
              {isOwnProfile && session?.user && (
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