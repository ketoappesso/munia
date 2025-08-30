'use client';

import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineQueue } from '@/lib/offlineQueue';

interface TelemetryEvent {
  type: string;
  timestamp: number;
  data?: any;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private maxEvents = 100;

  logEvent(type: string, data?: any) {
    const event: TelemetryEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    console.log('[Telemetry]', type, data);
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

export const telemetry = new TelemetryService();

export function useTelemetry() {
  const { isOnline, isOffline } = useNetworkStatus();

  useEffect(() => {
    const logNetworkChange = async () => {
      if (isOnline) {
        const posts = await offlineQueue.getPosts();
        telemetry.logEvent('network_online', { 
          queuedPosts: posts.length,
          lastOnline: Date.now()
        });
      } else if (isOffline) {
        telemetry.logEvent('network_offline', { 
          lastOffline: Date.now()
        });
      }
    };

    logNetworkChange();
  }, [isOnline, isOffline]);

  const logPostAttempt = (success: boolean, isOffline: boolean, retryCount?: number) => {
    telemetry.logEvent('post_attempt', {
      success,
      isOffline,
      retryCount,
      timestamp: Date.now()
    });
  };

  const logQueueOperation = (operation: string, postId?: string) => {
    telemetry.logEvent('queue_operation', {
      operation,
      postId,
      timestamp: Date.now()
    });
  };

  const logWebSocketEvent = (event: string, data?: any) => {
    telemetry.logEvent('websocket_event', {
      event,
      ...data,
      timestamp: Date.now()
    });
  };

  return {
    logPostAttempt,
    logQueueOperation,
    logWebSocketEvent,
    getEvents: telemetry.getEvents.bind(telemetry),
    clear: telemetry.clear.bind(telemetry),
  };
}