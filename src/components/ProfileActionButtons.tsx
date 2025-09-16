'use client';

import Button from '@/components/ui/Button';
import { useFollowsMutations } from '@/hooks/mutations/useFollowsMutations';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function ProfileActionButtons({ targetUserId }: { targetUserId: string }) {
  const { data: session } = useSession();
  const { data: targetUser, isPending } = useUserQuery(targetUserId);
  const isFollowing = targetUser?.isFollowing;
  const router = useRouter();
  const { followMutation, unFollowMutation } = useFollowsMutations({
    targetUserId,
  });

  const handleClick = useCallback(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    if (isFollowing) {
      unFollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }, [isFollowing, followMutation, unFollowMutation, session, router]);

  const handleDM = useCallback(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    if (targetUser?.username) {
      router.push(`/messages/${targetUser.username}`);
    }
  }, [router, targetUser?.username, session]);

  return (
    <div className="flex flex-row items-center gap-2 md:gap-4">
      <Button onPress={handleClick} mode={isFollowing ? 'secondary' : 'primary'} shape="pill" loading={isPending}>
        {isFollowing ? '取消关注' : '关注'}
      </Button>
      <Button
        onPress={handleDM}
        mode="secondary"
        shape="pill"
        Icon={MessageCircle}
        className="min-w-[40px] px-2"
        aria-label="私信"
        title="私信"
      />
    </div>
  );
}
