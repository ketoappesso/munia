'use client';

import { memo, useCallback, useMemo, useEffect, useState, useRef } from 'react';
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
import { MessageCircle, Trophy, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { AcceptTaskModal } from './AcceptTaskModal';
import { TaskStatusModal } from './TaskStatusModal';
import { MyTaskModal } from './MyTaskModal';
import { ToggleStepper } from './ui/ToggleStepper';
import { Comments } from './Comments';
import { PostVisualMediaContainer } from './PostVisualMediaContainer';
import ProfileBlock from './ProfileBlock';
import { HighlightedMentionsAndHashTags } from './HighlightedMentionsAndHashTags';
import { PostOptions } from './PostOptions';
import { useVolcengineTTS } from '@/hooks/useVolcengineTTS';
import { AudioPlayer } from './AudioPlayer';
import { getVoiceForUser } from '@/lib/volcengine/voiceMapping';
import { useTTSContext } from '@/contexts/TTSContext';

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
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showMyTaskModal, setShowMyTaskModal] = useState(false);
    const [isAcceptingTask, setIsAcceptingTask] = useState(false);
    const [displayedText, setDisplayedText] = useState<string>('');
    const [showText, setShowText] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const router = useRouter();

    // Fetch post data first
    const { data, isPending, isError } = useQuery<GetPost>({
      queryKey: ['posts', postId],
      queryFn: async () => {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          throw new Error('Error getting post');
        }
        return (await res.json()) as GetPost;
      },
      staleTime: 60000 * 5, // 5 minutes cache
    });
    
    // Check if this post has been played before from localStorage
    useEffect(() => {
      const playedPosts = localStorage.getItem('tts-played-posts');
      if (playedPosts) {
        const playedPostIds = JSON.parse(playedPosts) as number[];
        if (playedPostIds.includes(postId)) {
          // Post has been played before, show text immediately
          setShowText(true);
          setIsCompleted(true);
          if (data?.content) {
            setDisplayedText(data.content);
          }
        }
      }
    }, [postId, data?.content]);
    
    // Get the appropriate voice for the post author
    const { selectedVoice } = useTTSContext();
    const authorVoice = useMemo(() => {
      if (data?.user) {
        // First check if this user has a custom voice mapping
        const voice = getVoiceForUser(
          data.user.phoneNumber,
          null, // Don't use the stored ttsVoiceId initially
          selectedVoice
        );
        console.log('Post author voice selection:', {
          phoneNumber: data.user.phoneNumber,
          ttsVoiceId: data.user.ttsVoiceId,
          mappedVoice: voice,
          usingCustom: voice.startsWith('S_'),
        });
        return voice;
      }
      return selectedVoice;
    }, [data?.user, selectedVoice]);
    
    const { 
      speak, 
      stop, 
      pause,
      resume,
      isPlaying, 
      isPaused,
      isLoading,
      isSupported,
      progress,
      isFallback,
    } = useVolcengineTTS({
      voice: authorVoice,
      speed: 1.0,
      onStart: () => {
        setShowText(true);
        setDisplayedText('');
      },
      onEnd: () => {
        setIsCompleted(true);
        setDisplayedText(data?.content || '');
        
        // Save to localStorage that this post has been played
        const playedPosts = localStorage.getItem('tts-played-posts');
        const playedPostIds = playedPosts ? JSON.parse(playedPosts) as number[] : [];
        if (!playedPostIds.includes(postId)) {
          playedPostIds.push(postId);
          localStorage.setItem('tts-played-posts', JSON.stringify(playedPostIds));
        }
      },
      fallbackToBrowser: true, // Use browser TTS if Volcengine fails
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
    
    const handleTTSToggle = useCallback(() => {
      if (!data?.content) return;
      
      if (isPlaying) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
      } else {
        // Start playback with better synchronization
        const textLength = data.content.length;
        speak(data.content, (charIndex) => {
          setDisplayedText(data.content.slice(0, charIndex + 1));
        }, textLength);
      }
    }, [data?.content, isPlaying, isPaused, pause, resume, speak]);
    
    const handleTTSStop = useCallback(() => {
      stop();
      // If not completed, hide text again
      if (!isCompleted) {
        setShowText(false);
        setDisplayedText('');
      }
    }, [stop, isCompleted]);
    
    // Calculate estimated duration
    const getEstimatedDuration = useCallback(() => {
      if (!data?.content) return '0:00';
      // Chinese speech rate is approximately 3 characters per second at normal speed
      const seconds = Math.ceil(data.content.length / 3);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, [data?.content]);
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

    // All hooks have been called above this point - safe to do early returns
    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Error loading post.</p>;
    if (!data) return <p>This post no longer exists.</p>;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { content, createdAt, user: author, visualMedia, isLiked, _count, isTask, rewardAmount, taskStatus, completedAt } = data;
    const isOwnPost = userId === author.id;
    const numberOfLikes = _count.postLikes;
    // Task is considered accepted if it's in any of these states
    const isTaskAccepted = taskStatus === 'IN_PROGRESS' || taskStatus === 'COMPLETION_REQUESTED' || 
                          taskStatus === 'COMPLETED' || taskStatus === 'FAILED';
    const isTaskExpired = taskStatus === 'EXPIRED';
    
    // Calculate days until expiration for open tasks
    const daysUntilExpiration = taskStatus === 'OPEN' 
      ? Math.max(0, 30 - Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : null;
    
    // Debug logging for task button visibility
    if (isTask) {
      console.log(`Task Post ${postId} Debug:`, {
        isTask,
        isOwnPost,
        taskStatus,
        isTaskAccepted,
        currentUserId: userId,
        authorId: author.id,
        shouldShowButton: !isOwnPost && isTask,
      });
    }
    const daysInProgress = completedAt 
      ? Math.floor((Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
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
      const username = author.username || author.id;
      router.push(`/messages/${username}`);
    }, [router, author, session]);
    
    const handleOpenAcceptModal = useCallback(() => {
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }
      setShowAcceptModal(true);
    }, [session]);
    
    const handleAcceptTask = useCallback(async () => {
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }
      
      setIsAcceptingTask(true);
      setShowAcceptModal(false); // Close modal immediately to avoid UI issues
      
      try {
        console.log('Starting task acceptance for post:', postId);
        console.log('Task owner:', author);
        console.log('Current user:', session.user);
        
        // Call API to accept the task
        const res = await fetch(`/api/posts/${postId}/accept-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            acceptorId: session.user.id,
          }),
        });
        
        console.log('Accept task response status:', res.status);
        
        if (!res.ok) {
          const error = await res.json();
          console.error('Failed to accept task:', error);
          // Show error and stop execution
          alert(error.error || '揭榜失败，请稍后重试');
          setIsAcceptingTask(false);
          return;
        }
        
        const acceptResult = await res.json();
        console.log('Task accepted successfully:', acceptResult);
        
        // Create or get existing conversation between task owner and acceptor
        console.log('Creating conversation with task owner...');
        const conversationRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: author.id,
            initialMessage: `🎯 我已接受您的悬赏任务\n\n📋 任务内容：${content}\n💰 悬赏金额：${rewardAmount} APE\n\n请问有什么具体要求吗？`,
          }),
        });
        
        console.log('Conversation creation response status:', conversationRes.status);
        
        if (!conversationRes.ok) {
          const errorData = await conversationRes.json();
          console.error('Failed to create conversation:', errorData);
          // Still redirect even if conversation fails
          alert(`创建对话失败：${errorData.error || '未知错误'}\n但任务已成功接受，将为您跳转到消息页面`);
        } else {
          const conversation = await conversationRes.json();
          console.log('Conversation created/retrieved:', conversation);
          
          // Automatically send commission red packet from task owner to acceptor
          console.log('Sending commission red packet...');
          try {
            const redPacketRes = await fetch('/api/red-packets/send-commission-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                postId,
                acceptorId: session.user.id,
                amount: rewardAmount,
                conversationId: conversation.id,
              }),
            });
            
            if (redPacketRes.ok) {
              console.log('Commission red packet sent successfully');
            } else {
              const error = await redPacketRes.json();
              console.error('Failed to send commission red packet:', error);
            }
          } catch (error) {
            console.error('Error sending commission red packet:', error);
          }
        }
        
        // Always redirect to messages after accepting task
        const targetUsername = author.username || author.id;
        console.log('Redirecting to chat with:', targetUsername);
        
        // Use replace instead of push to avoid back button issues
        await router.replace(`/messages/${targetUsername}`);
        
      } catch (error) {
        console.error('Error accepting task:', error);
        alert(`揭榜失败：${error.message || '请稍后重试'}`);
        setIsAcceptingTask(false);
      }
    }, [postId, session, author, content, rewardAmount, router]);

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
            name={author.name || author.username || 'Unknown User'}
            username={author.username || author.id}
            time={timeAgo || createdAt}
            photoUrl={author.profilePhoto || ''}
          />
          {isOwnPost && <PostOptions postId={postId} content={content} visualMedia={visualMedia} />}
        </div>
        {isTask && (
          <div className="mt-4 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
              <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-bold uppercase">Task</span>
              <span>悬赏: {rewardAmount} APE</span>
            </div>
            {(isTaskAccepted || isTaskExpired) && (
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                taskStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                taskStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                taskStatus === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <CheckCircle className="h-3.5 w-3.5" />
                <span>
                  {taskStatus === 'COMPLETED' ? '任务完成' :
                   taskStatus === 'FAILED' ? '任务失败' :
                   taskStatus === 'EXPIRED' ? '任务已过期' :
                   `已揭榜（任务已执行${daysInProgress}天）`}
                </span>
              </div>
            )}
            {taskStatus === 'OPEN' && daysUntilExpiration !== null && daysUntilExpiration <= 7 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                <span>剩余{daysUntilExpiration}天</span>
              </div>
            )}
          </div>
        )}
        {content && (
          <div className="flex items-start gap-3 mb-4 mt-3">
            {/* Timer box on the left - only show before playback starts */}
            {!showText && !isCompleted && isSupported && (
              <div className="flex items-center px-2 py-1 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs text-gray-500 font-mono">
                  {getEstimatedDuration()}
                </span>
              </div>
            )}
            <div className="flex-1">
              {!showText && !isCompleted ? (
                // Initially hide text - show nothing or a subtle placeholder
                <div className="text-lg text-muted-foreground opacity-0">
                  <HighlightedMentionsAndHashTags text={content} shouldAddLinks />
                </div>
              ) : isPlaying || (showText && !isCompleted) ? (
                // Show typewriter effect during playback with fade-in effect (no cursor)
                <div className="text-lg text-muted-foreground">
                  <span className="inline">
                    {displayedText.split('').map((char, index) => (
                      <span
                        key={index}
                        className="inline-block animate-fadeIn"
                        style={{
                          animationDelay: `${index * 0.01}s`,
                          opacity: 0,
                          animationFillMode: 'forwards'
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                </div>
              ) : (
                // Show full text after completion
                <p className="text-lg text-muted-foreground">
                  <HighlightedMentionsAndHashTags text={content} shouldAddLinks />
                </p>
              )}
            </div>
            {isSupported && (
              <AudioPlayer
                isPlaying={isPlaying}
                isPaused={isPaused}
                isLoading={isLoading}
                progress={progress}
                duration={data?.content ? Math.ceil(data.content.length / 3) : undefined}
                onPlay={handleTTSToggle}
                onPause={handleTTSToggle}
                onStop={handleTTSStop}
                showTimer={true}
                size="md"
                isFallback={isFallback}
              />
            )}
          </div>
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
            {isTask && (
              isOwnPost ? (
                // Show clickable button for own tasks
                <button
                  onClick={() => setShowMyTaskModal(true)}
                  className="flex items-center gap-1.5 rounded-full bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-300 transition-all cursor-pointer">
                  <Trophy className="h-3.5 w-3.5" />
                  我的任务
                </button>
              ) : (
                // Show accept/status button for others' tasks
                <button
                  onClick={isTaskAccepted ? () => setShowStatusModal(true) : isTaskExpired ? undefined : handleOpenAcceptModal}
                  disabled={isTaskExpired}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    isTaskExpired
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isTaskAccepted 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700',
                  )}>
                  <Trophy className="h-3.5 w-3.5" />
                  {taskStatus === 'COMPLETION_REQUESTED' 
                    ? '待确认' 
                    : taskStatus === 'COMPLETED' 
                      ? '任务完成' 
                      : taskStatus === 'FAILED'
                        ? '任务失败'
                      : taskStatus === 'EXPIRED'
                        ? '已过期'
                      : isTaskAccepted 
                        ? '已揭榜' 
                        : '揭榜'}
                </button>
              )
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
        
        {/* Accept Task Modal */}
        {isTask && data && !isTaskAccepted && (
          <AcceptTaskModal
            isOpen={showAcceptModal}
            onClose={() => setShowAcceptModal(false)}
            onAccept={handleAcceptTask}
            post={data}
            isAccepting={isAcceptingTask}
          />
        )}
        
        {/* Loading overlay when accepting task */}
        {isAcceptingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />
                <p className="text-lg font-medium">正在揭榜...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Task Status Modal */}
        {isTask && data && isTaskAccepted && (
          <TaskStatusModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            post={data}
          />
        )}
        
        {/* My Task Modal for task owner */}
        {isTask && data && isOwnPost && (
          <MyTaskModal
            isOpen={showMyTaskModal}
            onClose={() => setShowMyTaskModal(false)}
            post={data}
          />
        )}
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps),
);

Post.displayName = 'Post';
