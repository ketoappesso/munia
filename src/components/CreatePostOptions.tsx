'use client';

import React, { forwardRef, useCallback, useRef } from 'react';
import SvgImage from '@/svg_components/Image';
import { Coins } from 'lucide-react';
import { ButtonNaked } from './ui/ButtonNaked';
import { useLanguage } from '@/contexts/LanguageContext';

export const CreatePostOptions = forwardRef<
  HTMLInputElement,
  {
    handleVisualMediaChange: React.ChangeEventHandler<HTMLInputElement>;
    onRewardClick?: () => void;
    hasReward?: boolean;
  }
>(({ handleVisualMediaChange, onRewardClick, hasReward }, forwardedRef) => {
  const { t } = useLanguage();
  const localRef = useRef<HTMLInputElement | null>(null);
  const assignRef = useCallback(
    (node: HTMLInputElement) => {
      // https://stackoverflow.com/a/62238917/8434369
      localRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );
  const onUploadImageOrVideoPress = useCallback(() => localRef.current?.click(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-row justify-center px-4 pb-5">
      <div className="flex gap-6">
        <ButtonNaked aria-label={t('post.uploadImageVideoAria')} className="flex gap-4" onPress={onUploadImageOrVideoPress}>
          <SvgImage className="h-6 w-6 text-muted-foreground" />
          <p className="text-base font-semibold text-muted-foreground group-hover:text-muted-foreground/80">
            {t('post.imageVideo')}
          </p>
        </ButtonNaked>
        {onRewardClick && (
          <ButtonNaked 
            aria-label={t('post.addRewardAria')} 
            className="flex gap-4" 
            onPress={onRewardClick}>
            <Coins className={`h-6 w-6 ${hasReward ? 'text-purple-600' : 'text-muted-foreground'}`} />
            <p className={`text-base font-semibold ${hasReward ? 'text-purple-600' : 'text-muted-foreground group-hover:text-muted-foreground/80'}`}>
              {t('task.rewardAction')}
            </p>
          </ButtonNaked>
        )}
      </div>
      <input
        ref={assignRef}
        type="file"
        className="hidden"
        name="visualMedia"
        onChange={handleVisualMediaChange}
        accept="video/*,.jpg,.jpeg,.png,.webp"
        multiple
      />
    </div>
  );
});

CreatePostOptions.displayName = 'CreatePostOptions';
