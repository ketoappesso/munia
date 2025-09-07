'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import AIRobot from '@/svg_components/AIRobot';

interface AIConversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  isPinned?: boolean;
}

export function AISubscriptionsList() {
  const router = useRouter();

  // Fetch AI conversations specifically
  const { data: aiConversations = [], isLoading } = useQuery<AIConversation[]>({
    queryKey: ['conversations', 'ai'],
    queryFn: () => fetcher('/api/conversations?aiOnly=true'),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const handleAIClick = () => {
    // Navigate to AI chat conversation
    router.push('/messages/xiaoyuan_ai');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-lg p-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="min-w-0 flex-1">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aiConversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={handleAIClick}
          className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-800"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <AIRobot className="h-6 w-6 text-white" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                {conversation.otherUser.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500">在线</span>
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(conversation.lastMessage.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
            <p className="truncate text-sm text-gray-600 dark:text-gray-400">
              {conversation.lastMessage?.content || '你好！很高兴见到你。今天有什么可以帮助你的吗？'}
            </p>
          </div>
          
          {conversation.unreadCount > 0 && (
            <div className="shrink-0">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                {conversation.unreadCount}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* 占位内容 - 未来可以添加更多AI订阅 */}
      <div className="py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <AIRobot className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">更多AI助手即将上线</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">敬请期待更多智能服务</p>
          </div>
        </div>
      </div>
    </div>
  );
}