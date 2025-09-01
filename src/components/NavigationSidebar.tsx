'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Coins } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';

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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-background shadow-xl"
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
            <div className="space-y-2 p-4">
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
