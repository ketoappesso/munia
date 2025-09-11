'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
}

interface VirtualizedMessagesProps {
  messages: Message[];
  currentUsername: string;
  className?: string;
}

export function VirtualizedMessages({ messages, currentUsername, className = '' }: VirtualizedMessagesProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height per message
    overscan: 5,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const virtualItems = virtualizer.getVirtualItems();

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>还没有消息，开始对话吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className={`h-full overflow-y-auto ${className}`}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
          }}>
          {virtualItems.map((virtualRow) => {
            const message = messages[virtualRow.index];
            const isOwnMessage = message.sender.username === currentUsername;

            return (
              <div
                key={message.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                {!isOwnMessage ? (
                  <div className="flex items-start gap-2">
                    <Image
                      src={message.sender.profilePhoto || '/images/default-avatar.svg'}
                      alt={message.sender.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="max-w-xs rounded-2xl bg-gray-200 px-4 py-2 md:max-w-md">
                      <p className="text-sm text-gray-900">{message.content}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs rounded-2xl bg-gray-800 px-4 py-2 md:max-w-md">
                    <p className="text-sm text-white">{message.content}</p>
                    <p className="mt-1 text-xs text-gray-300">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
