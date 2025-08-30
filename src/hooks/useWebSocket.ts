'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface WebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessage?: any;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnect = true,
  maxReconnectAttempts = 10,
  reconnectDelay = 1000,
}: WebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const { isOnline } = useNetworkStatus();

  const connect = useCallback(() => {
    if (!isOnline) return;

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        onClose?.();

        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectDelay * 2 ** reconnectAttemptsRef.current,
            30000, // Max 30 seconds
          );

          reconnectTimeoutRef.current = setTimeout(
            () => {
              reconnectAttemptsRef.current++;
              connect();
            },
            delay + Math.random() * 1000,
          ); // Add jitter
        }
      };

      wsRef.current.onerror = (error) => {
        onError?.(error);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, maxReconnectAttempts, reconnectDelay, isOnline]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (isOnline) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, isOnline]);

  return {
    send,
    disconnect,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
