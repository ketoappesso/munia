'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ChevronRight } from 'lucide-react';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      username: string;
      name: string;
      profilePhoto: string;
    };
  } | null;
  unreadCount: number;
}

export function MessagesList() {
  const { data: session } = useSession();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3 animate-pulse bg-gray-100">
            <div className="h-12 w-12 rounded-full bg-gray-300" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-gray-300" />
              <div className="h-3 w-2/3 rounded bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
        <p>暂无聊天记录</p>
        <p className="text-sm mt-2">开始与朋友聊天吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/messages/${conversation.otherUser.username}`}
          className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <Image
            src={conversation.otherUser.profilePhoto || '/images/default-avatar.jpg'}
            alt={conversation.otherUser.name}
            width={48}
            height={48}
            className="rounded-full"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate">
                {conversation.otherUser.name || conversation.otherUser.username}
              </h3>
              {conversation.lastMessage && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </span>
              )}
            </div>
            
            {conversation.lastMessage && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {conversation.lastMessage.content}
              </p>
            )}
            
            {conversation.unreadCount > 0 && (
              <div className="mt-1">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary text-white">
                  {conversation.unreadCount}
                </span>
              </div>
            )}
          </div>
          
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Link>
      ))}
    </div>
  );
}