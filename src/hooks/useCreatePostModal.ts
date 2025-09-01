import { useCreatePostModalContextApi } from '@/contexts/CreatePostModalContext';
import { GetVisualMedia } from '@/types/definitions';

export function useCreatePostModal() {
  const { setShown, setShouldOpenFileInputOnMount, setToEditValues, setInitialRewardAmount, setIsTask } = useCreatePostModalContextApi();

  const launchCreatePost = ({ 
    shouldOpenFileInputOnMount = false,
    initialRewardAmount = 0,
    isTask = false
  }: { 
    shouldOpenFileInputOnMount?: boolean;
    initialRewardAmount?: number;
    isTask?: boolean;
  }) => {
    setToEditValues(null);
    setShouldOpenFileInputOnMount(shouldOpenFileInputOnMount);
    setInitialRewardAmount(initialRewardAmount);
    setIsTask(isTask);
    setShown(true);
  };

  const launchEditPost = ({
    initialContent,
    initialVisualMedia,
    postId,
  }: {
    initialContent: string;
    initialVisualMedia: GetVisualMedia[];
    postId: number;
  }) => {
    setToEditValues({
      postId,
      initialContent,
      initialVisualMedia,
    });
    setShown(true);
  };

  const exitCreatePostModal = () => {
    setShown(false);
  };

  return { launchCreatePost, launchEditPost, exitCreatePostModal };
}
