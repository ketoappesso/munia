'use client';

import { useState, useCallback, Key, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AuthModal } from '@/components/AuthModal';
import { MessagesList } from './MessagesList';
import { Notifications } from '../notifications/Notifications';
import HamburgerMenu from '@/svg_components/HamburgerMenu';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import Search from '@/svg_components/Search';
import { DropdownMenuButton } from '@/components/ui/DropdownMenuButton';
import { Section, Item } from 'react-stately';
import { useNotificationsCountQuery } from '@/hooks/queries/useNotificationsCountQuery';
import { useNotificationsReadStatusMutations } from '@/hooks/mutations/useNotificationsReadStatusMutations';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: notificationCount } = useNotificationsCountQuery();
  const { markAllAsReadMutation } = useNotificationsReadStatusMutations();
  
  const handleCloseAuthModal = useCallback(() => setShowAuthModal(false), []);
  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as 'messages' | 'notifications');
  }, []);
  
  const handleSearchClick = useCallback(() => {
    router.push('/messages/search');
  }, [router]);
  
  const markAllAsRead = useCallback(
    (key: Key) => {
      if (key === 'mark-all') {
        markAllAsReadMutation.mutate();
      }
    },
    [markAllAsReadMutation],
  );

  const disabledKeys = useMemo(() => {
    if (notificationCount === undefined || notificationCount === 0) {
      return ['mark-all'];
    }
    return [];
  }, [notificationCount]);

  if (status === 'loading') {
    return (
      <>
        <div className="px-4 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center">
            <div className="flex rounded-lg bg-gray-200 p-1">
              {['信息', '提醒'].map((tab) => (
                <div key={tab} className="rounded-md px-4 py-2 text-sm text-gray-500">
                  {tab}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="ml-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
              <HamburgerMenu className="h-5 w-5 stroke-gray-700" />
            </button>
          </div>
          </div>
          <div className="py-8 text-center">
            <p>Loading...</p>
          </div>
        </div>
        
        <NavigationSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          currentPage="messages"
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </>
    );
  }

  return (
    <>
      <div className="px-4 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-1 justify-start">
            {activeTab === 'messages' ? (
              <button
                type="button"
                onClick={handleSearchClick}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
                <Search className="h-5 w-5 stroke-gray-700" />
              </button>
            ) : (
              <DropdownMenuButton
                key="notifications-option"
                label="Notifications option"
                onAction={markAllAsRead}
                disabledKeys={disabledKeys}>
                <Section>
                  <Item key="mark-all">Mark all as read</Item>
                </Section>
              </DropdownMenuButton>
            )}
          </div>
          <div className="flex items-center">
            <div className="flex rounded-lg bg-gray-200 p-1">
              {[
                { id: 'messages', label: '信息' },
                { id: 'notifications', label: '提醒' },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'messages' | 'notifications')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="ml-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
              <HamburgerMenu className="h-5 w-5 stroke-gray-700" />
            </button>
          </div>
        </div>

      {session?.user ? (
        <>
          {activeTab === 'messages' && <MessagesList />}
          {activeTab === 'notifications' && (
            <div>
              <Notifications userId={session.user.id} />
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-500">请登录后查看消息</p>
        </div>
      )}

        <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
      </div>

      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        currentPage="messages"
      />
    </>
  );
}
