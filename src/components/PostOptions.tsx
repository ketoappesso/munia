import { useSession } from 'next-auth/react';
import { Item, Section } from 'react-stately';
import { useDialogs } from '@/hooks/useDialogs';
import { GetVisualMedia } from '@/types/definitions';
import { Key, useCallback, useState } from 'react';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import { useDeletePostMutation } from '@/hooks/mutations/useDeletePostMutation';
import { DropdownMenuButton } from './ui/DropdownMenuButton';
import { useToast } from '@/hooks/useToast';
import { usePunk } from '@/contexts/PunkContext';
import { useTTSContext } from '@/contexts/TTSContext';

export function PostOptions({
  postId,
  content,
  visualMedia,
  audioData,
}: {
  postId: number;
  content: string | null;
  visualMedia?: GetVisualMedia[];
  audioData?: string | null;
}) {
  const { data: session } = useSession();
  const { confirm } = useDialogs();
  const { launchEditPost } = useCreatePostModal();
  const { deleteMutation } = useDeletePostMutation();
  const { showToast } = useToast();
  const { punkedVoiceId, isPunkedActive } = usePunk();
  const { playbackSpeed } = useTTSContext();
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadVoice = useCallback(async () => {
    if (!audioData) {
      // If no audio data is available, generate it first
      if (!content) {
        showToast('没有可转换的文本内容', 'error');
        return;
      }

      setIsDownloading(true);

      try {
        // Get user's voice settings
        let voiceId = null;

        // Check if user has a custom voice
        const settingsResponse = await fetch('/api/user/tts-settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          voiceId = settings.ttsVoiceId;
        }

        // Use punked voice if active
        if (isPunkedActive && punkedVoiceId) {
          voiceId = punkedVoiceId;
        }

        // Call TTS API
        const response = await fetch('/api/tts/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: content,
            voice: voiceId,
            speed: playbackSpeed || 1.0,
            volume: 1.0,
            pitch: 1.0,
            encoding: 'mp3',
          }),
        });

        const result = await response.json();

        if (result.success && result.audio) {
          // Convert base64 to blob and download
          const byteCharacters = atob(result.audio);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/mp3' });

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;

          // Generate filename with post ID and timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          a.download = `post-${postId}-voice-${timestamp}.mp3`;

          document.body.appendChild(a);
          a.click();

          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          showToast('语音下载成功', 'success');
        } else {
          showToast('语音合成失败', 'error');
        }
      } catch (error) {
        console.error('Download voice error:', error);
        showToast('下载失败', 'error');
      } finally {
        setIsDownloading(false);
      }
    } else {
      // Use the existing audio data from playback
      try {
        // Convert base64 to blob and download
        const byteCharacters = atob(audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Generate filename with post ID and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `post-${postId}-voice-${timestamp}.mp3`;

        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('语音下载成功', 'success');
      } catch (error) {
        console.error('Download voice error:', error);
        showToast('下载失败', 'error');
      }
    }
  }, [audioData, content, postId, isPunkedActive, punkedVoiceId, playbackSpeed, showToast]);

  const handleOptionClick = useCallback(
    (key: Key) => {
      if (key === 'edit') {
        handleEditClick();
      } else if (key === 'delete') {
        handleDeleteClick();
      } else if (key === 'download-voice') {
        handleDownloadVoice();
      }
    },
    [handleEditClick, handleDeleteClick, handleDownloadVoice],
  );

  return (
    <DropdownMenuButton key={`posts-${postId}-options`} label="帖子操作" onAction={handleOptionClick}>
      <Section>
        <Item key="edit">编辑帖子</Item>
        <Item key="delete">删除帖子</Item>
        <Item key="download-voice">{isDownloading ? '下载中...' : '下载语音'}</Item>
      </Section>
    </DropdownMenuButton>
  );
}
