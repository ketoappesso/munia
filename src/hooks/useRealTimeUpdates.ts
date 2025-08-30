'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useWebSocket } from './useWebSocket';

interface RealTimeUpdate {
  type: 'post_created' | 'post_updated' | 'post_deleted' | 'comment_created' | 'like_toggled';
  data: any;
  timestamp: number;
}

export function useRealTimeUpdates() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const handleMessage = (update: RealTimeUpdate) => {
    switch (update.type) {
      case 'post_created':
        queryClient.setQueryData(['posts', update.data.id], update.data);
        // Invalidate relevant queries to refresh feeds
        queryClient.invalidateQueries({ queryKey: ['users', session?.user?.id, 'posts'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        break;

      case 'post_updated':
        queryClient.setQueryData(['posts', update.data.id], update.data);
        break;

      case 'post_deleted':
        queryClient.removeQueries({ queryKey: ['posts', update.data.id] });
        queryClient.invalidateQueries({ queryKey: ['users', session?.user?.id, 'posts'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        break;

      case 'comment_created':
        queryClient.invalidateQueries({ queryKey: ['posts', update.data.postId, 'comments'] });
        break;

      case 'like_toggled':
        queryClient.invalidateQueries({ queryKey: ['posts', update.data.postId, 'likes'] });
        break;
    }
  };

  // Temporarily disabled WebSocket connection to fix runtime errors
  // TODO: Implement WebSocket server endpoint or remove this functionality
  // const { isConnected } = useWebSocket({
  //   url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002/ws',
  //   onMessage: handleMessage,
  //   reconnect: true,
  //   maxReconnectAttempts: Infinity,
  //   reconnectDelay: 1000,
  // });

  return { isConnected: false };
}
