'use client';

import { useSession } from 'next-auth/react';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import SvgImage from '@/svg_components/Image';
import { useCallback, useState } from 'react';
import { Coins } from 'lucide-react';
import { ProfilePhotoOwn } from './ui/ProfilePhotoOwn';
import { ButtonNaked } from './ui/ButtonNaked';
import { RewardModal } from './RewardModal';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';

export function CreatePostModalLauncher() {
  const { data: session } = useSession();
  const { launchCreatePost } = useCreatePostModal();
  const { data: wallet } = useWalletQuery();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [pendingRewardAmount, setPendingRewardAmount] = useState<number>(0);
  
  const launcCreatePostFinderClosed = useCallback(() => {
    if (!session?.user) return;
    launchCreatePost({});
  }, [launchCreatePost, session]);
  
  const launchCreatePostFinderOpened = useCallback(() => {
    if (!session?.user) return;
    launchCreatePost({
      shouldOpenFileInputOnMount: true,
    });
  }, [launchCreatePost, session]);
  
  const handleRewardClick = useCallback(() => {
    if (!session?.user) return;
    setShowRewardModal(true);
  }, [session]);
  
  const handleRewardSelect = useCallback((amount: number) => {
    setPendingRewardAmount(amount);
    setShowRewardModal(false);
    // Launch create post with reward
    launchCreatePost({
      initialRewardAmount: amount,
      isTask: true,
    });
  }, [launchCreatePost]);

  return (
    <div className="rounded-xl bg-card px-4 py-4 shadow sm:px-8 sm:py-5">
      <div className="mb-[18px] flex flex-row">
        <div className="mr-3 h-12 w-12">
          <ProfilePhotoOwn />
        </div>
        <ButtonNaked onPress={launcCreatePostFinderClosed} className="flex flex-grow flex-col justify-center">
          <p className="text-muted-foreground/70">想到啥说啥</p>
        </ButtonNaked>
      </div>
      <div className="flex flex-row justify-center">
        <div className="flex gap-6">
          <ButtonNaked
            onPress={launchCreatePostFinderOpened}
            className="group flex cursor-pointer flex-row items-center gap-4">
            <SvgImage className="h-6 w-6 text-muted-foreground" />
            <p className="text-base font-semibold text-muted-foreground group-hover:text-muted-foreground/80">
              图片 / 视频
            </p>
          </ButtonNaked>
          <ButtonNaked
            onPress={handleRewardClick}
            className="group flex cursor-pointer flex-row items-center gap-4">
            <Coins className="h-6 w-6 text-muted-foreground" />
            <p className="text-base font-semibold text-muted-foreground group-hover:text-muted-foreground/80">
              悬赏
            </p>
          </ButtonNaked>
        </div>
      </div>
      
      {showRewardModal && (
        <RewardModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          onSelect={handleRewardSelect}
          currentBalance={wallet?.apeBalance || 0}
        />
      )}
    </div>
  );
}
