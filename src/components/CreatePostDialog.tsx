import Button from '@/components/ui/Button';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GetVisualMedia } from '@/types/definitions';
import { useWritePostMutations } from '@/hooks/mutations/useWritePostMutations';
import { useDialogs } from '@/hooks/useDialogs';
import { capitalize } from 'lodash';
import { revokeVisualMediaObjectUrls } from '@/lib/revokeVisualMediaObjectUrls';
import { ToEditValues } from '@/lib/createPost';
import { TextAreaWithMentionsAndHashTags } from './TextAreaWithMentionsAndHashTags';
import { GenericDialog } from './GenericDialog';
import { CreatePostSort } from './CreatePostSort';
import { ProfilePhotoOwn } from './ui/ProfilePhotoOwn';
import { CreatePostOptions } from './CreatePostOptions';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';
import { RewardModal } from './RewardModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { processMediaFiles } from '@/lib/media-compression';
import { useToast } from '@/hooks/useToast';

const MAX_CONTENT_LENGTH = 1000;

export function CreatePostDialog({
  toEditValues,
  shouldOpenFileInputOnMount,
  setShown,
  initialRewardAmount = 0,
  isTaskInitial = false,
}: {
  toEditValues: ToEditValues | null;
  shouldOpenFileInputOnMount: boolean;
  setShown: (isOpen: boolean) => void;
  initialRewardAmount?: number;
  isTaskInitial?: boolean;
}) {
  const mode: 'create' | 'edit' = toEditValues === null ? 'create' : 'edit';
  const { t } = useLanguage();
  const [content, setContent] = useState(toEditValues?.initialContent || '');
  const [visualMedia, setVisualMedia] = useState<GetVisualMedia[]>(toEditValues?.initialVisualMedia ?? []);
  const [rewardAmount, setRewardAmount] = useState<number>(initialRewardAmount);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isTaskPost, setIsTaskPost] = useState(isTaskInitial);
  const [contentExceedsLimit, setContentExceedsLimit] = useState(false);
  const exitCreatePostModal = useCallback(() => setShown(false), [setShown]);
  const { data: wallet } = useWalletQuery();
  const { createPostMutation, updatePostMutation } = useWritePostMutations({
    content: isTaskPost ? content : content,
    visualMedia,
    exitCreatePostModal,
    rewardAmount,
    isTask: isTaskPost,
  });
  const { confirm } = useDialogs();
  const { showToast } = useToast();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVisualMediaChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(async (e) => {
    const { files } = e.target;

    if (files === null) return;
    const filesArr = [...files];

    // Show loading toast
    showToast({ title: 'Processing media...', type: 'info' });

    // Process files (compress images, validate videos)
    const { processedFiles, errors, compressionInfo } = await processMediaFiles(filesArr);

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach(error => {
        showToast({ title: 'Error', message: error, type: 'error', duration: 5000 });
      });
    }

    // Create visual media objects from processed files
    const selectedVisualMedia: GetVisualMedia[] = processedFiles.map((file) => ({
      type: file.type.startsWith('image/') ? 'PHOTO' : 'VIDEO',
      url: URL.createObjectURL(file),
    }));

    // If compression saved space, show success message
    if (compressionInfo.compressionRatio > 0.1) {
      const savedMB = ((compressionInfo.totalOriginalSize - compressionInfo.totalCompressedSize) / (1024 * 1024)).toFixed(1);
      showToast({
        title: 'Media optimized',
        message: `Saved ${savedMB}MB through compression`,
        type: 'success'
      });
    }

    setVisualMedia((prev) => [...prev, ...selectedVisualMedia]);
    // Clear the file input
    e.target.value = '';
  }, [showToast]);

  const handleClickPostButton = useCallback(() => {
    if (content.length > MAX_CONTENT_LENGTH) return;
    if (mode === 'create') {
      createPostMutation.mutate();
    } else {
      if (!toEditValues) return;
      updatePostMutation.mutate({ postId: toEditValues.postId });
    }
  }, [createPostMutation, mode, toEditValues, updatePostMutation, content]);

  const handleRewardSelect = useCallback((amount: number) => {
    setRewardAmount(amount);
    setIsTaskPost(true);
    setShowRewardModal(false);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    if (newContent.length > MAX_CONTENT_LENGTH) {
      setContent(newContent.slice(0, MAX_CONTENT_LENGTH));
      setContentExceedsLimit(true);
    } else {
      setContent(newContent);
      setContentExceedsLimit(false);
    }
  }, []);

  const handleRemoveReward = useCallback(() => {
    setRewardAmount(0);
    setIsTaskPost(false);
  }, []);

  const exit = useCallback(() => {
    exitCreatePostModal();
    // Revoke the object URL's when exiting the create post dialog
    revokeVisualMediaObjectUrls(visualMedia);
  }, [exitCreatePostModal, visualMedia]);

  const confirmExit = useCallback(() => {
    confirm({
      title: t('dialog.unsavedTitle'),
      message: t('dialog.unsavedMessage'),
      onConfirm: () => setTimeout(() => exit(), 300),
    });
  }, [confirm, exit, t]);

  const handleClose = useCallback(() => {
    if (mode === 'create') {
      if (content !== '' || visualMedia.length > 0) {
        confirmExit();
        return;
      }
    } else if (mode === 'edit') {
      if (content !== toEditValues?.initialContent || visualMedia !== toEditValues.initialVisualMedia) {
        confirmExit();
        return;
      }
    }
    exit();
  }, [confirmExit, content, visualMedia, mode, toEditValues, exit]);

  const sortVariants = useMemo(
    () => ({
      initial: { height: 0 },
      animate: { height: 'auto' },
      exit: { height: 0 },
    }),
    [],
  );

  useEffect(() => {
    if (inputFileRef.current === null) return;
    if (shouldOpenFileInputOnMount) inputFileRef.current.click();
  }, [shouldOpenFileInputOnMount]);

  useEffect(() => {
    if (textareaRef.current === null) return;
    textareaRef.current.focus();
  }, []);

  useEffect(() => {
    const onEscPressed = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', onEscPressed, false);
    return () => {
      document.removeEventListener('keydown', onEscPressed, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GenericDialog title={mode === 'create' ? t('post.createPost') : t('post.editPost')} handleClose={handleClose}>
      <div className="mb-[18px] flex flex-row gap-3 px-4">
        <div className="h-11 w-11">
          <ProfilePhotoOwn />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          {isTaskPost && rewardAmount > 0 && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-3 py-2">
              <span className="text-sm font-medium text-purple-600">{t('task.rewardAmountLabel')}: {rewardAmount} APE</span>
              <button
                onClick={handleRemoveReward}
                className="ml-auto text-xs text-gray-500 hover:text-red-500">
                {t('common.cancel')}
              </button>
            </div>
          )}
          <TextAreaWithMentionsAndHashTags
            content={content}
            setContent={handleContentChange}
            placeholder={isTaskPost ? t('post.taskPlaceholder') : t('post.saySomething')}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-xs ${content.length > MAX_CONTENT_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </span>
            {contentExceedsLimit && (
              <span className="text-xs text-red-500">内容已超过1000字限制，超出部分已被截断</span>
            )}
          </div>
        </div>
        <div>
          <Button
            onPress={handleClickPostButton}
            size="small"
            isDisabled={(content === '' && visualMedia.length === 0) || content.length > MAX_CONTENT_LENGTH}
            loading={createPostMutation.isPending || updatePostMutation.isPending}
            className={isTaskPost ? 'bg-gradient-to-r from-purple-600 to-blue-600' : ''}>
            {isTaskPost ? t('task.rewardAction') : t('post.post')}
          </Button>
        </div>
      </div>
      <CreatePostOptions 
        handleVisualMediaChange={handleVisualMediaChange} 
        ref={inputFileRef}
        onRewardClick={() => setShowRewardModal(true)}
        hasReward={isTaskPost && rewardAmount > 0}
      />
      <AnimatePresence>
        {visualMedia.length > 0 && (
          <motion.div
            variants={sortVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden">
            <CreatePostSort visualMedia={visualMedia} setVisualMedia={setVisualMedia} />
          </motion.div>
        )}
      </AnimatePresence>
      {showRewardModal && (
        <RewardModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          onSelect={handleRewardSelect}
          currentBalance={wallet?.apeBalance || 0}
        />
      )}
    </GenericDialog>
  );
}
