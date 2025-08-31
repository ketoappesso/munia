'use client';

import Link from 'next/link';
import { ProfilePhoto } from './ui/ProfilePhoto';
import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useFollowsMutations } from '@/hooks/mutations/useFollowsMutations';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ProfileBlockWithActionsProps {
  type?: 'post' | 'comment';
  userId: string;
  username: string;
  name: string;
  time: string;
  photoUrl: string;
}

export default function ProfileBlockWithActions({
  type = 'post',
  userId,
  username,
  name,
  time,
  photoUrl,
}: ProfileBlockWithActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isOwnProfile = session?.user?.id === userId;
  
  const { data: targetUser } = useUserQuery(userId);
  const isFollowing = targetUser?.isFollowing;
  
  const { followMutation, unFollowMutation } = useFollowsMutations({
    targetUserId: userId,
  });

  const handleFollowClick = useCallback(() => {
    if (!session?.user) {
      window.location.href = '/login';
      return;
    }
    
    if (isFollowing) {
      unFollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }, [isFollowing, followMutation, unFollowMutation, session]);

  const handleMessageClick = useCallback(() => {
    if (!session?.user) {
      window.location.href = '/login';
      return;
    }
    router.push(`/messages/${username}`);
  }, [router, username, session]);

  return (
    <div className="flex items-start justify-between">
      <div className="flex gap-3">
        <div className="h-12 w-12 flex-shrink-0">
          <ProfilePhoto photoUrl={photoUrl} username={username} name={name} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 sm:gap-3">
            <h2 className="cursor-pointer text-lg font-semibold text-muted-foreground">
              <Link href={`/${username}`} className="link">
                {name}
              </Link>
            </h2>
            {type === 'comment' && <h2 className="text-sm text-muted-foreground/90">{time} ago</h2>}
          </div>
          {type === 'post' && <h2 className="text-sm text-muted-foreground/90">{time} ago</h2>}
        </div>
      </div>

      {!isOwnProfile && (
        <div className="flex items-center gap-2">
          {!isFollowing ? (
            <button
              onClick={handleFollowClick}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                "bg-gray-900 text-white hover:bg-gray-800",
                "dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              )}
              disabled={followMutation.isPending || unFollowMutation.isPending}
            >
              {followMutation.isPending ? '...' : '关注'}
            </button>
          ) : (
            <button
              onClick={handleMessageClick}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                "bg-gray-100 text-gray-900 hover:bg-gray-200",
                "dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              私信
            </button>
          )}
        </div>
      )}
    </div>
  );
}