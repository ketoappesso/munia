'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserPlus, MessageCircle } from 'lucide-react';
import { useFollowsMutations } from '@/hooks/mutations/useFollowsMutations';
import { ButtonNaked } from './ui/ButtonNaked';

interface FeedFollowButtonProps {
  authorId: string;
  authorUsername: string;
}

export function FeedFollowButton({ authorId, authorUsername }: FeedFollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.id;

  const [isFollowing, setIsFollowing] = useState(false);

  const { followMutation, unFollowMutation } = useFollowsMutations({ targetUserId: authorId });

  const handleFollow = useCallback(async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    if (!isFollowing) {
      followMutation.mutate(undefined, {
        onSuccess: () => {
          setIsFollowing(true);
        },
      });
    } else {
      unFollowMutation.mutate(undefined, {
        onSuccess: () => {
          setIsFollowing(false);
        },
      });
    }
  }, [currentUserId, isFollowing, followMutation, unFollowMutation, router]);

  const handleDM = useCallback(() => {
    router.push(`/messages/${authorUsername}`);
  }, [router, authorUsername]);

  if (currentUserId === authorId) return null;

  return (
    <div className="ml-auto pl-2">
      {!isFollowing ? (
        <ButtonNaked
          onPress={handleFollow}
          disabled={followMutation.isPending || unFollowMutation.isPending}
          className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
          <UserPlus className="h-4 w-4" />
          关注
        </ButtonNaked>
      ) : (
        <ButtonNaked
          onPress={handleDM}
          className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700">
          <MessageCircle className="h-4 w-4" />
          私信
        </ButtonNaked>
      )}
    </div>
  );
}
