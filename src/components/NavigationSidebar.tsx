'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useRouter } from 'next/navigation';

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
