import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GetUser } from '@/types/definitions';
import { useSession } from 'next-auth/react';
import { useToast } from '../useToast';
import { useAuthErrorHandler } from '../useAuthErrorHandler';

const follow = async ({ userId, targetUserId }: { userId: string; targetUserId: string }) => {
  const res = await fetch(`/api/users/${userId}/following`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIdToFollow: targetUserId }),
  });

  if (!res.ok) {
    if (res.status === 409) return;
    throw new Error('Failed to follow user.');
  }
};

const unFollow = async ({ userId, targetUserId }: { userId: string; targetUserId: string }) => {
  const res = await fetch(`/api/users/${userId}/following/${targetUserId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    if (res.status === 409) return;
    throw new Error('Failed to unfollow user.');
  }
};

export function useFollowsMutations({ targetUserId }: { targetUserId: string }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user.id;
  const queryKey = ['users', targetUserId];
  const { showToast } = useToast();
  const { handleAuthError } = useAuthErrorHandler();

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        const error = new Error('User not authenticated.');
        await handleAuthError(error);
        return Promise.reject(error);
      }
      return follow({ userId: currentUserId, targetUserId });
    },
    onMutate: async () => {
      // Cancel outgoing queries and snapshot the prev value
      await qc.cancelQueries({ queryKey });
      const previousTargetUser = qc.getQueryData(queryKey);

      // Optimistically update the UI
      qc.setQueryData<GetUser>(queryKey, (oldTargetUser) => {
        if (!oldTargetUser) return oldTargetUser;
        return {
          ...oldTargetUser,
          isFollowing: true,
          followerCount: (oldTargetUser.followerCount || 0) + 1,
        };
      });

      // Return a context object with the snapshotted value
      return { previousTargetUser };
    },
    onError: async (err: Error, variables, context) => {
      const handled = await handleAuthError(err);
      if (!handled) {
        qc.setQueryData(queryKey, context?.previousTargetUser);
        showToast({
          title: 'Something Went Wrong',
          message: err.message,
          type: 'error',
        });
      }
    },
  });

  const unFollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        const error = new Error('User not authenticated.');
        await handleAuthError(error);
        return Promise.reject(error);
      }
      return unFollow({ userId: currentUserId, targetUserId });
    },
    onMutate: async () => {
      // Cancel outgoing queries and snapshot the prev value
      await qc.cancelQueries({ queryKey });
      const previousTargetUser = qc.getQueryData(queryKey);

      // Optimistically update the UI
      qc.setQueryData<GetUser>(queryKey, (oldTargetUser) => {
        if (!oldTargetUser) return oldTargetUser;
        return {
          ...oldTargetUser,
          isFollowing: false,
          followerCount: (oldTargetUser.followerCount || 0) - 1,
        };
      });

      // Return a context object with the snapshotted value
      return { previousTargetUser };
    },
    onError: async (err: Error, variables, context) => {
      const handled = await handleAuthError(err);
      if (!handled) {
        qc.setQueryData(queryKey, context?.previousTargetUser);
        showToast({
          title: 'Something Went Wrong',
          message: err.message,
          type: 'error',
        });
      }
    },
  });

  return { followMutation, unFollowMutation };
}
