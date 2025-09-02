'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TaskCompletionMessageProps {
  postId: number;
  amount: number;
  isTaskOwner: boolean;
  acceptorName: string;
  onComplete?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onFail?: () => Promise<void>;
  status?: 'pending' | 'completed' | 'rejected' | 'failed';
}

export function TaskCompletionMessage({
  postId,
  amount,
  isTaskOwner,
  acceptorName,
  onComplete,
  onReject,
  onFail,
  status = 'pending'
}: TaskCompletionMessageProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'complete' | 'reject' | 'fail') => {
    if (!isTaskOwner || status !== 'pending') return;
    
    setIsProcessing(true);
    try {
      switch (action) {
        case 'complete':
          await onComplete?.();
          break;
        case 'reject':
          await onReject?.();
          break;
        case 'fail':
          await onFail?.();
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine if the message should be grayed out
  const isCompleted = status !== 'pending';
  
  return (
    <div className={cn(
      "w-full max-w-lg rounded-xl border-2 p-4 shadow-lg",
      isCompleted 
        ? "border-gray-300 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" 
        : "border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50"
    )}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isCompleted ? "bg-gray-400" : "bg-blue-500"
          )}>
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className={cn(
              "text-lg font-bold",
              isCompleted ? "text-gray-700" : "text-blue-900"
            )}>任务完成申请</span>
            <p className="text-xs text-gray-600">{acceptorName} 已申请任务完成</p>
          </div>
        </div>
        <div className={cn(
          "mt-3 rounded-lg p-2",
          isCompleted ? "bg-gray-200/50" : "bg-white/70"
        )}>
          <p className="text-center text-sm text-gray-700">
            待支付尾款: <span className={cn(
              "text-xl font-bold",
              isCompleted ? "text-gray-600" : "text-orange-600"
            )}>{amount} APE</span>
          </p>
        </div>
      </div>

      {/* Show buttons only when pending and user is task owner */}
      {status === 'pending' && isTaskOwner && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAction('fail')}
            disabled={isProcessing}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg bg-red-500 px-2 py-2 text-white transition-all hover:bg-red-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}>
            <XCircle className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">失败索赔</span>
          </button>

          <button
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg bg-yellow-500 px-2 py-2 text-white transition-all hover:bg-yellow-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}>
            <AlertCircle className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">不算成功</span>
          </button>

          <button
            onClick={() => handleAction('complete')}
            disabled={isProcessing}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg bg-green-500 px-2 py-2 text-white transition-all hover:bg-green-600",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}>
            <CheckCircle className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">成功完成</span>
          </button>
        </div>
      )}
      
      {/* Show disabled buttons when action has been taken */}
      {status !== 'pending' && isTaskOwner && (
        <div className="grid grid-cols-3 gap-2 opacity-50">
          <div className={cn(
            "flex flex-col items-center justify-center rounded-lg px-2 py-2 text-white cursor-not-allowed",
            status === 'failed' ? "bg-red-400" : "bg-gray-400"
          )}>
            <XCircle className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">失败索赔</span>
          </div>

          <div className={cn(
            "flex flex-col items-center justify-center rounded-lg px-2 py-2 text-white cursor-not-allowed",
            status === 'rejected' ? "bg-yellow-400" : "bg-gray-400"
          )}>
            <AlertCircle className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">不算成功</span>
          </div>

          <div className={cn(
            "flex flex-col items-center justify-center rounded-lg px-2 py-2 text-white cursor-not-allowed",
            status === 'completed' ? "bg-green-400" : "bg-gray-400"
          )}>
            <CheckCircle className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">成功完成</span>
          </div>
        </div>
      )}

      {/* Status messages */}
      {status === 'completed' && (
        <div className="rounded-lg bg-green-100 p-2 text-center">
          <p className="text-sm text-green-800">✅ 任务已完成，尾款已发放</p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="rounded-lg bg-yellow-100 p-2 text-center">
          <p className="text-sm text-yellow-800">⚠️ 任务未达标，无尾款发放</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="rounded-lg bg-red-100 p-2 text-center">
          <p className="text-sm text-red-800">❌ 任务失败，可联系客服索赔</p>
        </div>
      )}

      {!isTaskOwner && status === 'pending' && (
        <div className="rounded-lg bg-blue-100 p-2 text-center">
          <p className="text-sm text-blue-800">
            等待发布者确认（7天后自动发放）
          </p>
        </div>
      )}
    </div>
  );
}
