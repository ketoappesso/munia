'use client';

import { useSession } from 'next-auth/react';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import Button from '@/components/ui/Button';
import { Plus, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { offlineQueue } from '@/lib/offlineQueue';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className = '' }: FloatingActionButtonProps) {
  const { data: session } = useSession();
  const { launchCreatePost } = useCreatePostModal();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [queuedPosts, setQueuedPosts] = useState(0);

  const handleCreatePost = useCallback(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    launchCreatePost({});
  }, [launchCreatePost, session?.user, router]);

  useEffect(() => {
    const updateQueueCount = async () => {
      try {
        const posts = await offlineQueue.getPosts();
        setQueuedPosts(posts.length);
      } catch (error) {
        console.error('Failed to get offline queue count:', error);
      }
    };

    updateQueueCount();

    // Update queue count when network status changes
    const interval = setInterval(updateQueueCount, 5000);

    return () => clearInterval(interval);
  }, [isOnline]);

  return (
    <div className={`fixed bottom-20 right-6 z-50 md:bottom-6 ${className}`}>
      <Button
        shape="circle"
        size="xl"
        onPress={handleCreatePost}
        className="relative h-14 w-14 transform rounded-full bg-black text-white shadow-xl transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-black dark:bg-white dark:text-black dark:focus:ring-white"
        aria-label={isOnline ? 'Create new post' : 'Offline - posts will be sent when online'}>
        <Plus className="h-6 w-6" strokeWidth={3} />

        {/* Network status indicator */}
        {!isOnline && (
          <div className="absolute -right-1 -top-1 rounded-full bg-yellow-500 p-1">
            <WifiOff className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Queued posts badge */}
        {queuedPosts > 0 && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {queuedPosts}
          </div>
        )}
      </Button>

      {/* Offline status tooltip */}
      {!isOnline && (
        <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
          Offline - {queuedPosts} post{queuedPosts !== 1 ? 's' : ''} queued
        </div>
      )}
    </div>
  );
}
