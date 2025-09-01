'use client';

import { CreatePostModalLauncher } from '@/components/CreatePostModalLauncher';
import { Posts } from '@/components/Posts';
import { useSession } from 'next-auth/react';
import { AuthModal } from '@/components/AuthModal';
import { useCallback, useState } from 'react';
import ActionsPlus from '@/svg_components/ActionsPlus';
import HamburgerMenu from '@/svg_components/HamburgerMenu';
import { FeedSidebar } from '@/components/FeedSidebar';
import Link from 'next/link';

export default function Page() {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'following' | 'discover' | 'tasks'>('discover');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleCloseAuthModal = useCallback(() => setShowAuthModal(false), []);
  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const handleTabChange = useCallback((tab: 'following' | 'discover' | 'tasks') => {
    setActiveTab(tab);
  }, []);

  if (status === 'loading') {
    return (
      <div className="px-4 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-1 items-center">
            <button
              type="button"
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
              <HamburgerMenu className="h-5 w-5 stroke-gray-700" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="flex rounded-lg bg-gray-200 p-1">
              {['关注', '发现', '任务'].map((tab) => (
                <div key={tab} className="rounded-md px-4 py-2 text-sm text-gray-500">
                  {tab}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" />
        </div>
        <div className="py-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
              <HamburgerMenu className="h-5 w-5 stroke-gray-700" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="flex rounded-lg bg-gray-200 p-1">
              {[
                { id: 'following', label: '关注' },
                { id: 'discover', label: '发现' },
                { id: 'tasks', label: '任务' },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'following' | 'discover' | 'tasks')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 justify-end">
            <Link
              href="/discover"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300">
              <ActionsPlus className="h-5 w-5 stroke-gray-700" />
            </Link>
          </div>
        </div>

      {session?.user && <CreatePostModalLauncher />}

      {activeTab === 'following' && session?.user ? (
        <Posts type="feed" userId={session.user.id} />
      ) : activeTab === 'discover' ? (
        <Posts type="public" />
      ) : activeTab === 'tasks' ? (
        <Posts type="tasks" />
      ) : (
        <Posts type="public" />
      )}

        <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
      </div>

      <FeedSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </>
  );
}
