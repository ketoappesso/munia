'use client';

import SvgSend from '@/svg_components/Send';
import { useCallback, useState } from 'react';
import { useCreateCommentMutations } from '@/hooks/mutations/useCreateCommentMutations';
import Button from './ui/Button';
import { ProfilePhotoOwn } from './ui/ProfilePhotoOwn';
import { TextAreaWithMentionsAndHashTags } from './TextAreaWithMentionsAndHashTags';

export function CommentCreate({ postId }: { postId: number }) {
  const [content, setContent] = useState('');
  const { createCommentMutation } = useCreateCommentMutations();

  const handleCreate = useCallback(() => {
    createCommentMutation.mutate(
      { postId, content },
      {
        onSuccess: () => {
          setContent('');
        },
        onError: (error) => {
          if (error.message.includes('401')) {
            window.location.href = '/login';
          }
        },
      },
    );
  }, [content, createCommentMutation, postId]);

  return (
    <div className="mt-2 border-t-2 border-t-border py-4">
      <div className="flex">
        <div className="mr-3 h-10 w-10">
          <ProfilePhotoOwn />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <TextAreaWithMentionsAndHashTags
            content={content}
            setContent={setContent}
            placeholder="写下评论。"
            shouldFocusOnMount={false}
          />
        </div>
        <div className="self-end">
          <Button
            onPress={handleCreate}
            mode="ghost"
            size="small"
            isDisabled={content === ''}
            loading={createCommentMutation.isPending}
            Icon={SvgSend}
          />
        </div>
      </div>
    </div>
  );
}
