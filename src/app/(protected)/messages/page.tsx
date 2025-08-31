'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AuthModal } from '@/components/AuthModal';
import { MessagesList } from './MessagesList';
import { Notifications } from '../notifications/Notifications';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const handleCloseAuthModal = useCallback(() => setShowAuthModal(false), []);

  if (status === 'loading') {
    return (
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
          <div className="flex-1" />
        </div>
        <div className="py-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1" />
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
        <div className="flex-1" />
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
        <div className="text-center py-12">
          <p className="text-gray-500">请登录后查看消息</p>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
    </div>
  );
}