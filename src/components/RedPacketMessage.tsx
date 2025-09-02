'use client';

import { useState } from 'react';
import { Gift, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface RedPacketMessageProps {
  amount: number;
  message?: string;
  senderName: string;
  isOwn: boolean;
  isOpened?: boolean;
  onOpen?: () => void;
}

export function RedPacketMessage({ 
  amount, 
  message, 
  senderName,
  isOwn,
  isOpened = false,
  onOpen
}: RedPacketMessageProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = async () => {
    // Don't allow opening if already opened, it's own packet, or no handler
    if (isOpened || isOwn || !onOpen) return;
    
    setIsOpening(true);
    try {
      await onOpen();
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div 
      className={cn(
        "relative w-64 transition-transform",
        !isOwn && !isOpened && onOpen && "cursor-pointer hover:scale-105",
        isOpening && "animate-pulse"
      )}
      onClick={!isOpened && !isOwn && onOpen ? handleOpen : undefined}>
      {/* Red Packet Card */}
      <div className={cn(
        "rounded-xl overflow-hidden shadow-lg",
        "bg-gradient-to-br from-orange-500 to-red-500" // WeChat-like red-orange gradient
      )}>
        {/* Header */}
        <div className="px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                isOpened ? "bg-white/20" : "bg-white/30"
              )}>
                {isOpened ? (
                  <Check className="h-5 w-5 text-white" />
                ) : (
                  <Gift className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">
                  {isOwn ? "你发送的红包" : `${senderName}的红包`}
                </p>
                <p className="text-xs opacity-75">
                  {isOpened ? "已领取" : (isOwn ? "等待领取" : "点击领取")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 px-4 py-3 backdrop-blur-sm">
          <div className="text-center text-white">
            <p className="text-2xl font-bold">
              {amount} APE
            </p>
            {message && (
              <p className="mt-1 text-sm opacity-90">
                "{message}"
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/5 px-4 py-2 text-center">
          <p className="text-xs text-white/70">
            {isOpened ? "红包已被领取" : (isOwn ? "红包" : "点击领取红包")}
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {isOpening && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
