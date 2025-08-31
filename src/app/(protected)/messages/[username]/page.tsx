'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { ArrowLeft, Send, Plus, Camera, Image as ImageIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { useMessaging } from '@/hooks/useMessaging';
import { ChatMessages } from '@/components/ChatMessages';
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
  const { data: sessionData } = useSession();

  const [message, setMessage] = useState('');
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation and other user info
  const { data: otherUser } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const result = await fetcher(`/api/users?username=${username}`);
      console.log('Other user data:', result);
      return result;
    },
    enabled: !!username,
  });

  // Get or create conversation
  const { data: conversation, error: conversationError } = useQuery({
    queryKey: ['conversation', username],
    queryFn: async () => {
      if (!otherUser?.id) return null;
      console.log('Creating conversation with user:', otherUser.id);
      try {
        const response = await fetcher('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: otherUser.id }),
        });
        console.log('Conversation response:', response);
        return response;
      } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
    },
    enabled: !!otherUser?.id,
    retry: 2,
  });

  // Debug conversation data
  useEffect(() => {
    console.log('Conversation data:', conversation);
  }, [conversation]);

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

  // Messaging hook
  const { sendMessage: sendWebSocketMessage, isConnected } = useMessaging({
    conversationId: conversation?.id,
    onNewMessage: (newMessage) => {
      // Refresh messages when new message arrives
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) throw new Error('No conversation');

      // Use the messaging hook to send
      const success = await sendWebSocketMessage(content);
      if (success) {
        return { success: true };
      }
      throw new Error('Failed to send message');
    },
    onSuccess: () => {
      setMessage('');
      // Messages will be refreshed by the onNewMessage callback
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
    console.log('Send button clicked', {
      message: message.trim(),
      isPending: sendMessageMutation.isPending,
      conversationId: conversation?.id,
    });

    if (message.trim() && !sendMessageMutation.isPending && conversation?.id) {
      sendMessageMutation.mutate(message.trim());
    }
  }, [message, sendMessageMutation.isPending, sendMessageMutation.mutate, conversation?.id]);

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

  if (conversationError) {
    console.error('Conversation error:', conversationError);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Failed to start conversation</p>
          <p className="mt-2 text-sm text-gray-500">Please try again later</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{isConnected ? '在线' : '离线'}</p>
          </div>
          <div className="w-9" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Messages fill the space between header and input */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <ChatMessages messages={messages} otherUser={otherUser} />
      </div>

      {/* Message input fixed at bottom with XiaoHongShu style */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-end gap-2 p-3">
          <ButtonNaked
            onPress={() => setShowActions(!showActions)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
            <Plus
              className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-400 ${
                showActions ? 'rotate-45' : ''
              }`}
            />
          </ButtonNaked>

          <div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="发个消息吧~"
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:placeholder-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-900"
              onKeyDown={handleKeyDown}
              aria-label="消息输入框"
              rows={1}
            />
          </div>

          {message.trim() ? (
            <ButtonNaked
              onPress={handleSendMessage}
              isDisabled={sendMessageMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              <Send className="h-4 w-4" />
            </ButtonNaked>
          ) : (
            <div className="flex gap-1">
              <ButtonNaked className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                <Camera className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </ButtonNaked>
              <ButtonNaked className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </ButtonNaked>
            </div>
          )}
        </div>

        {/* Quick actions (shown when + is clicked) */}
        {showActions && (
          <div className="grid grid-cols-4 gap-4 border-t border-gray-100 p-4 dark:border-gray-800">
            <button className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">相册</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
                <Camera className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">拍摄</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
