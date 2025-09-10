import { useSession } from 'next-auth/react';
import { Item, Section } from 'react-stately';
import { useDialogs } from '@/hooks/useDialogs';
import { GetVisualMedia } from '@/types/definitions';
import { Key, useCallback } from 'react';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import { useDeletePostMutation } from '@/hooks/mutations/useDeletePostMutation';
import { DropdownMenuButton } from './ui/DropdownMenuButton';

export function PostOptions({
  postId,
  content,
  visualMedia,
}: {
  postId: number;
  content: string | null;
  visualMedia?: GetVisualMedia[];
}) {
  const { data: session } = useSession();
  const { confirm } = useDialogs();
  const { launchEditPost } = useCreatePostModal();
  const { deleteMutation } = useDeletePostMutation();

  const handleDeleteClick = useCallback(() => {
    if (!session?.user) return;
    confirm({
      title: '删除帖子',
      message: '确定要删除这条帖子吗？',
      onConfirm: () => {
        // Wait for the dialog to close before deleting the comment to pass the focus to
        // the next element first, preventing the focus from resetting to the top
        setTimeout(() => deleteMutation.mutate({ postId }), 300);
      },
    });
  }, [confirm, deleteMutation, postId, session]);

  const handleEditClick = useCallback(() => {
    if (!session?.user) return;
    launchEditPost({
      postId,
      initialContent: content ?? '',
      initialVisualMedia: visualMedia ?? [],
    });
  }, [launchEditPost, postId, content, visualMedia, session]);

  const handleOptionClick = useCallback(
    (key: Key) => {
      if (key === 'edit') {
        handleEditClick();
      } else {
        handleDeleteClick();
      }
    },
    [handleEditClick, handleDeleteClick],
  );

  return (
    <DropdownMenuButton key={`posts-${postId}-options`} label="Post options" onAction={handleOptionClick}>
      <Section>
        <Item key="edit">编辑帖子</Item>
        <Item key="delete">删除帖子</Item>
      </Section>
    </DropdownMenuButton>
  );
}
