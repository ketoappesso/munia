'use client';

import { useEffect, useState } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { Modal } from './Modal';
import Button from './ui/Button';
import { Trophy, Clock, User, Calendar, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { GetPost } from '@/types/definitions';
import { ProfilePhoto } from './ui/ProfilePhoto';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TaskStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: GetPost;
}

export function TaskStatusModal({ 
  isOpen, 
  onClose, 
  post,
}: TaskStatusModalProps) {
  const state = useOverlayTriggerState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [acceptor, setAcceptor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isTaskOwner = session?.user?.id === post.user.id;
  const isTaskAcceptor = session?.user?.id === post.completedBy;
  const canRequestCompletion = isTaskAcceptor && post.taskStatus === 'IN_PROGRESS';
  const canConfirmCompletion = isTaskOwner && post.taskStatus === 'COMPLETION_REQUESTED';
  
  // Request completion mutation
  const requestCompletionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/request-completion`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to request completion');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
      alert('任务完成申请已提交！请等待发布者确认。');
      onClose();
    },
    onError: (error) => {
      alert('申请失败：' + error.message);
    },
  });
  
  // Confirm completion mutation
  const confirmCompletionMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      const res = await fetch(`/api/posts/${post.id}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error('Failed to confirm completion');
      return res.json();
    },
    onSuccess: (data, approved) => {
      queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
      alert(approved ? '任务已确认完成，尾款已发放！' : '任务完成申请已拒绝');
      onClose();
    },
    onError: (error) => {
      alert('操作失败：' + error.message);
    },
  });
  
  useEffect(() => {
    if (isOpen && !state.isOpen) {
      state.open();
    } else if (!isOpen && state.isOpen) {
      state.close();
    }
  }, [isOpen]);

  useEffect(() => {
    // Fetch acceptor info when modal opens
    if (isOpen && post.completedBy) {
      setLoading(true);
      fetch(`/api/users/${post.completedBy}`)
        .then(res => res.json())
        .then(data => {
          setAcceptor(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, post.completedBy]);

  if (!state.isOpen) return null;

  const daysInProgress = post.completedAt 
    ? Math.floor((Date.now() - new Date(post.completedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return (
    <Modal state={state}>
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">任务已揭榜</h2>
              <p className="text-sm text-gray-500">悬赏金额: {post.rewardAmount} APE</p>
            </div>
          </div>

          {/* Task Description */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">任务描述</h3>
            <p className="text-gray-700">{post.content}</p>
          </div>

          {/* Status Info */}
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">
                任务已执行 {daysInProgress} 天
              </span>
            </div>
            {post.completedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  揭榜时间: {formatDistanceToNow(new Date(post.completedAt), { 
                    addSuffix: true, 
                    locale: zhCN 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Acceptor Info */}
          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-gray-900">揭榜人信息</h3>
            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-center text-gray-500">加载中...</p>
              </div>
            ) : acceptor ? (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="h-12 w-12">
                  <ProfilePhoto 
                    photoUrl={acceptor.profilePhoto} 
                    username={acceptor.username || acceptor.phoneNumber} 
                    name={acceptor.name || acceptor.username || '用户'} 
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {acceptor.name || acceptor.username || acceptor.phoneNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{acceptor.username || acceptor.phoneNumber}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 px-3 py-1">
                  <span className="text-xs font-medium text-green-700">执行中</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-center text-gray-500">无法加载揭榜人信息</p>
              </div>
            )}
          </div>

          {/* Payment Status */}
          {(post as any).initialPaymentAmount && (
            <div className="mb-4 space-y-2">
              <h3 className="font-semibold text-gray-900">佣金支付状态</h3>
              <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">首付（50%）</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{(post as any).initialPaymentAmount} APE</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">尾款（50%）</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{(post as any).finalPaymentAmount} APE</span>
                    {(post as any).finalPaymentAt ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Task Status Info */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              {post.taskStatus === 'IN_PROGRESS' && (
                <>
                  <span className="font-semibold">任务进行中：</span>
                  揭榜者可在完成任务后申请尾款。
                </>
              )}
              {post.taskStatus === 'COMPLETION_REQUESTED' && (
                <>
                  <span className="font-semibold">等待确认：</span>
                  {(post as any).completionRequestedAt && (
                    <>任务完成申请已于{formatDistanceToNow(new Date((post as any).completionRequestedAt), { addSuffix: true, locale: zhCN })}提交。</>
                  )}
                  发布者有7天时间确认，逾期将自动发放尾款。
                </>
              )}
              {post.taskStatus === 'COMPLETED' && (
                <>
                  <span className="font-semibold">任务已完成：</span>
                  所有佣金已发放完毕。
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canRequestCompletion && (
              <Button
                onPress={() => {
                  if (confirm('确认申请任务完成？发布者将有7天时间确认。')) {
                    requestCompletionMutation.mutate();
                  }
                }}
                loading={requestCompletionMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <DollarSign className="h-4 w-4 mr-1" />
                申请完成（获取尾款）
              </Button>
            )}
            
            {canConfirmCompletion && (
              <>
                <Button
                  onPress={() => {
                    if (confirm('确认任务已完成？尾款将立即发放给揭榜者。')) {
                      confirmCompletionMutation.mutate(true);
                    }
                  }}
                  loading={confirmCompletionMutation.isPending}
                  className="flex-1 bg-green-600 text-white">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  确认完成
                </Button>
                <Button
                  mode="secondary"
                  onPress={() => {
                    if (confirm('拒绝任务完成申请？揭榜者需要继续完成任务。')) {
                      confirmCompletionMutation.mutate(false);
                    }
                  }}
                  loading={confirmCompletionMutation.isPending}
                  className="flex-1">
                  <XCircle className="h-4 w-4 mr-1" />
                  拒绝
                </Button>
              </>
            )}
            
            {!canRequestCompletion && !canConfirmCompletion && (
              <Button
                mode="secondary"
                onPress={() => {
                  state.close();
                  onClose();
                }}
                className="w-full">
                关闭
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
