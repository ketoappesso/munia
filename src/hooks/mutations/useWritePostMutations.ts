import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { chunk } from 'lodash';
import { useSession } from 'next-auth/react';
import { GetVisualMedia, GetPost, PostIds } from '@/types/definitions';
import { POSTS_PER_PAGE } from '@/constants';
import { revokeVisualMediaObjectUrls } from '@/lib/revokeVisualMediaObjectUrls';
import { offlineQueue, OfflinePost } from '@/lib/offlineQueue';
import { useToast } from '../useToast';
import { useErrorNotifier } from '../useErrorNotifier';
import { useNetworkStatus } from '../useNetworkStatus';
import { useTelemetry } from '../useTelemetry';

export function useWritePostMutations({
  content,
  visualMedia,
  exitCreatePostModal,
  rewardAmount = 0,
  isTask = false,
}: {
  content: string;
  visualMedia: GetVisualMedia[];
  exitCreatePostModal: () => void;
  rewardAmount?: number;
  isTask?: boolean;
}) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const { isOnline } = useNetworkStatus();
  const queryKey = ['users', session?.user?.id, 'posts'];
  const { showToast } = useToast();
  const { notifyError } = useErrorNotifier();
  const { logPostAttempt, logQueueOperation } = useTelemetry();

  const generateFormData = async (): Promise<FormData> => {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (isTask) {
      formData.append('isTask', 'true');
      formData.append('rewardAmount', rewardAmount.toString());
    }

    const visualMediaFilesPromises = visualMedia.map(async ({ url }) => {
      if (url.startsWith('blob:')) {
        // If the url is a blob, fetch the blob and append it to the formData
        const file = await fetch(url).then((r) => r.blob());
        formData.append('files', file, file.name);
      } else {
        // If the url is a link, just append it to the formData
        formData.append('files', url);
      }
    });
    await Promise.all(visualMediaFilesPromises);

    return formData;
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        // Store offline and throw special error to trigger offline handling
        const clientId = session?.user?.id || 'anonymous';
        const postId = await offlineQueue.addPost({
          content,
          visualMedia,
          timestamp: Date.now(),
          clientId,
        });
        logPostAttempt(false, true, 0);
        logQueueOperation('add_offline', postId);
        throw new Error('OFFLINE_QUEUED');
      }

      const res = await fetch(`/api/posts`, {
        method: 'POST',
        body: await generateFormData(),
      });

      if (!res.ok) throw new Error(res.statusText);
      // Return the created post to be used by callbacks.
      return (await res.json()) as GetPost;
    },
    onSuccess: (createdPost) => {
      // Create a query for the created post
      qc.setQueryData(['posts', createdPost.id], createdPost);

      // Update the inifinite query of `PostIds`
      qc.setQueriesData<InfiniteData<PostIds>>({ queryKey }, (oldData) => {
        if (!oldData) return oldData;

        // Flatten the old pages first then prepend the newly created post
        const newPosts = [{ id: createdPost.id, commentsShown: false }, ...(oldData?.pages ?? []).flat()];

        // Chunk the `newPosts` depending on the number of posts per page
        const newPages = chunk(newPosts, POSTS_PER_PAGE);

        const newPageParams = [
          // The first `pageParam` is undefined as the initial page does not use a `pageParam`
          undefined,
          // Create the new `pageParams`, it must contain the id of each page's (except last page's) last post
          ...newPages.slice(0, -1).map((page) => page.at(-1)?.id),
        ];

        return {
          pages: newPages,
          pageParams: newPageParams,
        };
      });
      showToast({ title: 'Successfully Posted', type: 'success' });
      logPostAttempt(true, false, 0);
      revokeVisualMediaObjectUrls(visualMedia);
      exitCreatePostModal();
    },
    onError: (err) => {
      if (err.message === 'OFFLINE_QUEUED') {
        showToast({
          title: 'Post queued for offline',
          message: 'Your post will be sent when you are back online',
          type: 'info',
          duration: 3000,
        });
        revokeVisualMediaObjectUrls(visualMedia);
        exitCreatePostModal();
      } else {
        notifyError(err, 'Error Creating Post');
      }
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: number }) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: await generateFormData(),
      });

      if (!res.ok) throw new Error(res.statusText);
      // Return the created post to be used by callbacks.
      return (await res.json()) as GetPost;
    },
    onSuccess: (updatedPost) => {
      // Update the query for the updated post
      qc.setQueryData(['posts', updatedPost.id], updatedPost);

      // Update the inifinite query of `PostIds` TODO: There might be no need for `setQueriesData`
      qc.setQueriesData<InfiniteData<PostIds>>({ queryKey }, (oldData) => {
        if (!oldData) return oldData;

        // Flatten the old pages first
        const oldPosts = oldData?.pages.flat();

        // Find the index of the updated post
        const index = oldPosts?.findIndex((post) => post.id === updatedPost.id);

        // Write the updated post
        oldPosts[index] = {
          id: updatedPost.id,
          commentsShown: false,
        };

        return {
          pages: chunk(oldPosts, POSTS_PER_PAGE),
          pageParams: oldData.pageParams,
        };
      });
      showToast({ title: 'Successfully Edited', type: 'success' });
      revokeVisualMediaObjectUrls(visualMedia);
      exitCreatePostModal();
    },
    onError: (err) => {
      notifyError(err, 'Error Creating Post');
    },
  });

  return { createPostMutation, updatePostMutation };
}
