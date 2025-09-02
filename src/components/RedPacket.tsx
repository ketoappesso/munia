'use client';

import { useState } from 'react';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/cn';

interface RedPacketProps {
  amount: number;
  status: 'pending' | 'claimed' | 'expired';
  senderName: string;
  receiverName?: string;
  onClaim?: () => void;
  isReceiver?: boolean;
}

export function RedPacket({
  amount,
  status,
  senderName,
  receiverName,
  onClaim,
  isReceiver = false,
}: RedPacketProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleClick = async () => {
    if (status === 'pending' && isReceiver && onClaim) {
      setIsOpening(true);
      await onClaim();
      setIsOpening(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative w-64 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-4 shadow-lg transition-all',
        status === 'claimed' && 'from-gray-400 to-gray-500',
        status === 'expired' && 'from-gray-300 to-gray-400',
        isReceiver && status === 'pending' && 'hover:scale-105 hover:shadow-xl',
        isOpening && 'animate-pulse'
      )}>
      {/* Red packet pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-[url('/patterns/chinese-pattern.svg')] bg-repeat" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-white">任务红包</span>
          </div>
          {status === 'claimed' && (
            <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">
              已领取
            </span>
          )}
          {status === 'expired' && (
            <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">
              已过期
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="mb-2 text-center">
          <div className="text-3xl font-bold text-white">{amount} APE</div>
          <div className="text-sm text-white/80">悬赏佣金</div>
        </div>

        {/* Status message */}
        <div className="text-center text-xs text-white/90">
          {status === 'pending' && isReceiver && (
            <span>点击领取红包</span>
          )}
          {status === 'pending' && !isReceiver && (
            <span>等待{receiverName || '揭榜者'}领取</span>
          )}
          {status === 'claimed' && (
            <span>{receiverName}已领取</span>
          )}
          {status === 'expired' && (
            <span>红包已过期退回</span>
          )}
        </div>

        {/* Sender info */}
        <div className="mt-2 text-center text-xs text-white/70">
          来自 {senderName}
        </div>
      </div>

      {/* Opening animation overlay */}
      {isOpening && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
