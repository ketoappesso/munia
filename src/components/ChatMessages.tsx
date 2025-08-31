'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import Image from 'next/image';
import { format, isToday, isYesterday, parseISO, zhCN } from 'date-fns';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

interface ChatMessagesProps {
  messages: Message[];
  otherUser: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  className?: string;
}

export function ChatMessages({ messages, otherUser, className = '' }: ChatMessagesProps) {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Sort messages by serverTs to ensure correct order
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `昨天 ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MM/dd HH:mm', { locale: zhCN });
  };

  const shouldShowTimestamp = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;

    const currentTime = new Date(currentMsg.createdAt).getTime();
    const prevTime = new Date(prevMsg.createdAt).getTime();

    // Show timestamp if more than 5 minutes apart
    return currentTime - prevTime > 5 * 60 * 1000;
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const bottomThreshold = 100;
    const atBottom = scrollHeight - scrollTop - clientHeight < bottomThreshold;

    setIsAtBottom(atBottom);
    setShowScrollToBottom(!atBottom && messages.length > 0);
  }, [messages.length]);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll to bottom when new messages arrive if already at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('auto');
    }
  }, [sortedMessages.length, isAtBottom, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom('auto');
  }, [scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">还没有消息</p>
          <p className="mt-1 text-sm text-gray-500">开始你们的对话吧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn('h-full overflow-y-auto scroll-smooth px-4 py-2', className)}>
        <div className="space-y-3">
          {sortedMessages.map((message, index) => {
            const isOwnMessage = message.sender.id === session?.user?.id;
            const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
            const showTimestamp = shouldShowTimestamp(message, prevMessage);

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="my-2 text-center">
                    <span className="text-xs text-gray-400">{formatMessageTime(message.createdAt)}</span>
                  </div>
                )}

                <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
                  {!isOwnMessage && (
                    <div className="mr-2 flex-shrink-0">
                      <Image
                        src={message.sender.profilePhoto || '/images/default-avatar.jpg'}
                        alt={message.sender.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      'relative max-w-[70%] rounded-2xl px-4 py-2',
                      isOwnMessage
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
                    )}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    {!message.isRead && isOwnMessage && (
                      <div className="absolute -bottom-4 right-0 text-xs text-gray-400">未读</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className={cn(
            'absolute bottom-4 right-4 z-10',
            'flex h-10 w-10 items-center justify-center',
            'rounded-full bg-white shadow-lg',
            'hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
            'transition-all duration-200',
          )}
          aria-label="跳至最新消息">
          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
}
