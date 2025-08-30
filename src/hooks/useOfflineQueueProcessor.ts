'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { offlineQueue, OfflinePost } from '@/lib/offlineQueue';
import { useNetworkStatus } from './useNetworkStatus';
import { useToast } from './useToast';
import { useTelemetry } from './useTelemetry';

interface QueueProcessorOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export function useOfflineQueueProcessor(options: QueueProcessorOptions = {}) {
  const { maxRetries = 3, retryDelay = 5000 } = options;
  const { isOnline } = useNetworkStatus();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { logPostAttempt, logQueueOperation } = useTelemetry();

  const processPost = async (post: OfflinePost): Promise<boolean> => {
    try {
      const formData = new FormData();
      if (post.content) formData.append('content', post.content);

      // Handle visual media files
      for (const media of post.visualMedia) {
        if (media.url.startsWith('blob:')) {
          const file = await fetch(media.url).then((r) => r.blob());
          formData.append('files', file, file.name);
        } else {
          formData.append('files', media.url);
        }
      }

      const res = await fetch(`/api/posts`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(res.statusText);

      // Remove from queue on success
      await offlineQueue.removePost(post.id);
      logPostAttempt(true, false, post.retryCount);
      logQueueOperation('remove_success', post.id);
      return true;
    } catch (error) {
      console.error('Failed to process offline post:', error);
      
      // Update retry count
      const newRetryCount = post.retryCount + 1;
      if (newRetryCount >= maxRetries) {
        // Max retries reached, remove from queue
        await offlineQueue.removePost(post.id);
        logPostAttempt(false, false, newRetryCount);
        logQueueOperation('remove_failure', post.id);
        showToast({
          title: 'Failed to send post',
          message: 'Post could not be sent after multiple attempts',
          type: 'error',
        });
      } else {
        // Update retry count and wait for next attempt
        await offlineQueue.updateRetryCount(post.id, newRetryCount);
        logPostAttempt(false, false, newRetryCount);
        logQueueOperation('update_retry', post.id);
      }
      return false;
    }
  };

  const processQueue = async () => {
    if (!isOnline || !session?.user) return;

    try {
      const posts = await offlineQueue.getPosts();
      
      for (const post of posts) {
        // Skip if we've retried too recently
        if (post.lastAttempt && Date.now() - post.lastAttempt < retryDelay) {
          continue;
        }

        const success = await processPost(post);
        
        // Add delay between processing to avoid overwhelming the server
        if (!success) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  };

  useEffect(() => {
    if (isOnline && session?.user) {
      processQueue();
    }
  }, [isOnline, session?.user]);

  // Also process queue when user logs in
  useEffect(() => {
    if (session?.user) {
      processQueue();
    }
  }, [session?.user]);
}