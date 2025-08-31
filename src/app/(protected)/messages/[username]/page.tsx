'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { ArrowLeft, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fetcher } from '@/lib/fetcher';
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { VirtualizedMessages } from '@/components/VirtualizedMessages';

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
    queryFn: () => fetcher(`/api/users?username=${username}`),
    enabled: !!username,
  });

  // Get or create conversation
  const { data: conversation } = useQuery({
    queryKey: ['conversation', username],
    queryFn: async () => {
      if (!otherUser?.id) return null;
      const response = await fetcher('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: otherUser.id }),
      });
      return response;
    },
    enabled: !!otherUser?.id,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', conversation?.id],
    queryFn: () => {
      if (!conversation?.id) return [];
      return fetcher(`/api/conversations/${conversation.id}/messages`);
    },
    enabled: !!conversation?.id,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // WebSocket chat hook
  const { sendMessage: sendWebSocketMessage, isConnected } = useWebSocketChat({
    conversationId: conversation?.id,
    onNewMessage: (newMessage) => {
      queryClient.setQueryData(['messages', conversation?.id], (old: Message[] = []) => {
        // Check if message already exists to avoid duplicates
        if (!old.some(msg => msg.id === newMessage.id)) {
          const mergedMessage = {
            ...newMessage,
            sender: {
              id: newMessage.senderId,
              username: '',
              name: '',
              profilePhoto: '',
            },
          };
          return [...old, mergedMessage];
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) throw new Error('No conversation');
      
      // Try WebSocket first
      if (isConnected) {
        const success = sendWebSocketMessage(content);
        if (success) {
          return { success: true };
        }
      }
      
      // Fallback to HTTP
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
      if (conversation?.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      }
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
    if (message.trim() && !sendMessageMutation.isPending && conversation?.id) {
      sendMessageMutation.mutate(message.trim());
    }
  }, [message, sendMessageMutation, conversation?.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  if (!otherUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">Loading user...</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation ? '在线' : '加载中...'}
            </p>
          </div>

          <div className="w-9" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Messages fill the space between header and input */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <VirtualizedMessages 
          messages={messages} 
          currentUsername={username}
          className="p-4"
        />
      </div>

      {/* Message input fixed at bottom with no FAB */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-end gap-2">
          <Textarea
            value={message}
            onChange={setMessage}
            label="输入消息..."
            className="flex-1 resize-none border-0 bg-gray-100 focus:ring-2 focus:ring-gray-800"
            onKeyDown={handleKeyDown}
          />
          <ButtonNaked
            onPress={handleSendMessage}
            isDisabled={!message.trim() || sendMessageMutation.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-500">
            <Send className="h-4 w-4" />
          </ButtonNaked>
        </div>
      </div>
    </div>
  );
}
