'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEnhancedWebSocket } from './useEnhancedWebSocket';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
}

interface UseWebSocketChatOptions {
  conversationId?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export function useWebSocketChat({ conversationId, onNewMessage, onConnectionChange }: UseWebSocketChatOptions) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);

  const handleMessage = useCallback(
    (data: any) => {
      if (data.type === 'NEW_MESSAGE' && data.message) {
        onNewMessage?.(data.message);
      }
    },
    [onNewMessage],
  );

  const handleOpen = useCallback(() => {
    setIsConnected(true);
    onConnectionChange?.(true);
    reconnectAttemptsRef.current = 0;
  }, [onConnectionChange]);

  const handleClose = useCallback(() => {
    setIsConnected(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  const {
    send,
    isConnected: wsConnected,
    connectionState,
  } = useEnhancedWebSocket({
    url: conversationId ? `/api/ws/chat?conversationId=${conversationId}` : '/api/ws/chat',
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    reconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 1000,
    enableMessageQueue: true,
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!session?.user?.id || !conversationId) return false;

      return send({
        type: 'SEND_MESSAGE',
        conversationId,
        content,
        senderId: session.user.id,
        timestamp: new Date().toISOString(),
      });
    },
    [send, conversationId, session?.user?.id],
  );

  const markAsRead = useCallback(
    (messageId: string) => {
      if (!conversationId) return false;

      return send({
        type: 'MARK_AS_READ',
        conversationId,
        messageId,
      });
    },
    [send, conversationId],
  );

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  return {
    sendMessage,
    markAsRead,
    isConnected,
    connectionState,
  };
}
