'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseMessagingOptions {
  conversationId?: string;
  onNewMessage?: (message: any) => void;
}

export function useMessaging({ conversationId, onNewMessage }: UseMessagingOptions) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true); // Always connected for HTTP
  const [connectionState] = useState<'connected'>('connected');

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session?.user?.id || !conversationId) {
        console.error('Missing user ID or conversation ID');
        return false;
      }

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const message = await response.json();
        
        // Trigger callback for new message
        if (onNewMessage) {
          onNewMessage({
            ...message,
            senderId: session.user.id,
          });
        }

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    },
    [conversationId, session?.user?.id, onNewMessage, queryClient]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!conversationId) return false;

      try {
        // Implement mark as read API call here
        console.log('Marking message as read:', messageId);
        return true;
      } catch (error) {
        console.error('Error marking message as read:', error);
        return false;
      }
    },
    [conversationId]
  );

  return {
    sendMessage,
    markAsRead,
    isConnected,
    connectionState,
  };
}