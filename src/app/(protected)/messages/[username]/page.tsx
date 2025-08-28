'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { ArrowLeft, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getServerUser } from '@/lib/getServerUser';
import { includeUserSummary } from '@/lib/prisma/includeUserSummary';
import { fetcher } from '@/lib/fetcher';

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

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
}

export default function MessagesPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { username } = params;
  
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation and other user info
  const { data: otherUser } = useQuery({
    queryKey: ['user', username],
    queryFn: () => fetcher(`/api/users-basic?usernames=${username}`).then(res => res[0]),
    enabled: !!username,
  });

  // Get or create conversation
  const { data: conversation } = useQuery({
    queryKey: ['conversation', username],
    queryFn: async () => {
      const response = await fetcher('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: otherUser.id }),
      });
      return response;
    },
    enabled: !!otherUser,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', conversation?.id],
    queryFn: () => fetcher(`/api/conversations/${conversation.id}/messages`),
    enabled: !!conversation?.id,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleBack = useCallback(() => {
    router.push('/messages');
  }, [router]);

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  }, [message, sendMessageMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  if (!otherUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header stays fixed at top */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-16 items-center px-4">
          <ButtonNaked
            onPress={handleBack}
            className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </ButtonNaked>

          <div className="ml-3 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {otherUser.name || otherUser.username}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">在线</p>
          </div>

          <ButtonNaked 
            onPress={handleBack}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </ButtonNaked>
        </div>
      </div>

      {/* Messages fill the space between header and input */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>还没有消息，开始对话吧！</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender.username === username ? 'justify-start' : 'justify-end'}`}>
                {message.sender.username === username ? (
                  <div className="flex items-start gap-2">
                    <Image
                      src={message.sender.profilePhoto || '/images/default-avatar.jpg'}
                      alt={message.sender.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="max-w-xs md:max-w-md rounded-2xl bg-white px-4 py-2 shadow-sm dark:bg-gray-800">
                      <p className="text-sm text-gray-900 dark:text-white">{message.content}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs md:max-w-md rounded-2xl bg-blue-500 px-4 py-2 shadow-sm">
                    <p className="text-sm text-white">{message.content}</p>
                    <p className="mt-1 text-xs text-blue-100">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input fixed at bottom with no FAB */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={setMessage}
            label="输入消息..."
            className="flex-1 border-0 bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
            onKeyDown={handleKeyDown}
            rows={1}
            minRows={1}
            maxRows={4}
          />
          <ButtonNaked
            onPress={handleSendMessage}
            isDisabled={!message.trim() || sendMessageMutation.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 transition-colors">
            <Send className="h-4 w-4" />
          </ButtonNaked>
        </div>
      </div>
    </div>
  );
}