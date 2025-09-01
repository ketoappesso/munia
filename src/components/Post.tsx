'use client';

import { memo, useCallback, useMemo, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import SvgComment from '@/svg_components/Comment';
import { AnimatePresence, motion } from 'framer-motion';
import { GetPost, PostId } from '@/types/definitions';
import { isEqual } from 'lodash';
import SvgHeart from '@/svg_components/Heart';
import { useQuery } from '@tanstack/react-query';
import { usePostLikesMutations } from '@/hooks/mutations/usePostLikesMutations';
import { useFollowsMutations } from '@/hooks/mutations/useFollowsMutations';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import { useRouter } from 'next/navigation';
import { MessageCircle, Trophy } from 'lucide-react';
import { ToggleStepper } from './ui/ToggleStepper';
import { Comments } from './Comments';
import { PostVisualMediaContainer } from './PostVisualMediaContainer';
import ProfileBlock from './ProfileBlock';
import { HighlightedMentionsAndHashTags } from './HighlightedMentionsAndHashTags';
import { PostOptions } from './PostOptions';

export const Post = memo(
  ({
    id: postId,
    commentsShown,
    toggleComments,
  }: PostId & {
    toggleComments: (postId: number) => void;
  }) => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { likeMutation, unLikeMutation } = usePostLikesMutations({ postId });
    const [timeAgo, setTimeAgo] = useState<string>('');
    const router = useRouter();

    const { data, isPending, isError } = useQuery<GetPost>({
      queryKey: ['posts', postId],
      queryFn: async () => {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          throw new Error('Error getting post');
        }
        return (await res.json()) as GetPost;
      },
      staleTime: 60000 * 10,
    });

    const likePost = useCallback(() => likeMutation.mutate(), [likeMutation]);
    const unLikePost = useCallback(() => unLikeMutation.mutate(), [unLikeMutation]);
    const handleLikeToggle = useCallback(
      (isSelected: boolean) => {
        if (!session?.user) {
          window.location.href = '/login';
          return;
        }
        if (isSelected) {
          likePost();
        } else {
          unLikePost();
        }
      },
      [likePost, unLikePost, session],
    );
    const handleCommentsToggle = useCallback(() => {
      toggleComments(postId);
    }, [postId, toggleComments]);
    const variants = useMemo(
      () => ({
        animate: {
          height: 'auto',
          overflow: 'visible',
        },
        exit: {
          height: 0,
          overflow: 'hidden',
        },
      }),
      [],
    );

    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Error loading post.</p>;
    if (!data) return <p>This post no longer exists.</p>;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { content, createdAt, user: author, visualMedia, isLiked, _count, isTask, rewardAmount } = data;
    const isOwnPost = userId === author.id;
    const numberOfLikes = _count.postLikes;
    
    // Follow related logic
    const { data: targetUser } = useUserQuery(author.id);
    const isFollowing = targetUser?.isFollowing;
    const { followMutation, unFollowMutation } = useFollowsMutations({
      targetUserId: author.id,
    });
    
    const handleFollowClick = useCallback(() => {
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }
      followMutation.mutate();
    }, [followMutation, session]);
    
    const handleMessageClick = useCallback(() => {
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }
      const username = author.username || author.phoneNumber || author.id;
      router.push(`/messages/${username}`);
    }, [router, author, session]);
    
    const handleAcceptTask = useCallback(async () => {
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }
      // TODO: Implement task acceptance logic
      console.log('Accepting task for post:', postId);
      alert('揭榜功能开发中...');
    }, [postId, session]);

    // Calculate time ago on client side only to avoid hydration mismatch
    useEffect(() => {
      setTimeAgo(formatDistanceStrict(new Date(createdAt), new Date()));

      // Update time every minute
      const interval = setInterval(() => {
        setTimeAgo(formatDistanceStrict(new Date(createdAt), new Date()));
      }, 60000);

      return () => clearInterval(interval);
    }, [createdAt]);

    return (
      <div className="rounded-2xl bg-card px-4 shadow sm:px-8">
        <div className="flex items-center justify-between pt-4 sm:pt-5">
          <ProfileBlock
            name={author.name || author.username || author.phoneNumber || 'Unknown User'}
            username={author.username || author.phoneNumber || author.id}
            time={timeAgo || createdAt}
            photoUrl={author.profilePhoto || ''}
          />
          {isOwnPost && <PostOptions postId={postId} content={content} visualMedia={visualMedia} />}
        </div>
        {isTask && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-bold uppercase">Task</span>
            <span>悬赏: {rewardAmount} APE</span>
          </div>
        )}
        {content && (
          <p className="mb-4 mt-3 text-lg text-muted-foreground">
            <HighlightedMentionsAndHashTags text={content} shouldAddLinks />
          </p>
        )}
        {visualMedia.length > 0 && (
          <div className="mb-4 mt-5 overflow-hidden rounded-2xl">
            <PostVisualMediaContainer visualMedia={visualMedia} />
          </div>
        )}
        <div
          className={cn([
            'flex justify-between items-center gap-2 border-y border-y-border py-2',
            !commentsShown && 'border-b-transparent',
          ])}>
          <div className="flex gap-2">
            <ToggleStepper
              isSelected={isLiked}
              onChange={handleLikeToggle}
              Icon={SvgHeart}
              quantity={numberOfLikes}
              // noun="Like"
            />
            <ToggleStepper
              isSelected={commentsShown || false}
              onChange={handleCommentsToggle}
              Icon={SvgComment}
              quantity={_count.comments}
              color="blue"
              // noun="Comment"
            />
          </div>
          <div className="flex items-center gap-2">
            {!isOwnPost && isTask && (
              <button
                onClick={handleAcceptTask}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700',
                )}>
                <Trophy className="h-3.5 w-3.5" />
                揭榜
              </button>
            )}
            {!isOwnPost && (
              !isFollowing ? (
                <button
                  onClick={handleFollowClick}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    'bg-gray-900 text-white hover:bg-gray-800',
                    'dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
                  )}
                  disabled={followMutation.isPending}>
                  {followMutation.isPending ? '...' : '关注'}
                </button>
              ) : (
                <button
                  onClick={handleMessageClick}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    'bg-gray-100 text-gray-900 hover:bg-gray-200',
                    'dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700',
                  )}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  私信
                </button>
              )
            )}
          </div>
        </div>

        <AnimatePresence>
          {commentsShown && (
            <motion.div key={`${postId}-comments`} variants={variants} initial={false} animate="animate" exit="exit">
              <Comments postId={postId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps),
);

Post.displayName = 'Post';
