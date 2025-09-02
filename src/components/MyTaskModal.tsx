'use client';

import { useEffect, useState } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { Modal } from './Modal';
import Button from './ui/Button';
import { Trophy, Clock, User, Calendar, CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import { GetPost } from '@/types/definitions';
import { ProfilePhoto } from './ui/ProfilePhoto';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: GetPost;
}

export function MyTaskModal({ 
  isOpen, 
  onClose, 
  post,
}: MyTaskModalProps) {
  const state = useOverlayTriggerState({ isOpen, onOpenChange: (open) => !open && onClose() });
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [acceptor, setAcceptor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const hasAcceptor = !!post.completedBy;
  const taskStatus = post.taskStatus || 'OPEN';
  const canConfirmCompletion = taskStatus === 'COMPLETION_REQUESTED';
  const isExpired = taskStatus === 'EXPIRED';
  
  // Calculate days until expiration for open tasks
  const daysUntilExpiration = taskStatus === 'OPEN' 
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  
  // Handle task completion mutation - same endpoint as chat interface
  const handleTaskCompletionMutation = useMutation({
    mutationFn: async (action: 'complete' | 'reject' | 'fail') => {
      const res = await fetch(`/api/posts/${post.id}/handle-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to handle task completion');
      }
      return res.json();
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
      if (action === 'complete') {
        alert('任务已确认完成，尾款已发放！');
      } else if (action === 'reject') {
        alert('任务未达标，尾款未发放。');
      } else {
        alert('任务已标记为失败。');
      }
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
    // Fetch acceptor info when modal opens and there's an acceptor
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
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              hasAcceptor 
                ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}>
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {taskStatus === 'EXPIRED' ? '任务已过期' : 
                 taskStatus === 'FAILED' ? '任务失败' :
                 taskStatus === 'COMPLETED' ? '任务完成' :
                 taskStatus === 'ENDED' ? '任务结束' :
                 taskStatus === 'COMPLETION_REQUESTED' ? '待确认完成' :
                 hasAcceptor ? '任务进行中' : '等待揭榜'}
              </h2>
              <p className="text-sm text-gray-500">悬赏金额: {post.rewardAmount} APE</p>
            </div>
          </div>

          {/* Task Description */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">任务描述</h3>
            <p className="text-gray-700">{post.content}</p>
          </div>

          {taskStatus === 'EXPIRED' ? (
            /* Task expired */
            <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">任务已过期</p>
                  <p className="mt-1 text-sm text-gray-700">
                    该任务30天内无人揭榜，已自动过期。佣金已退回您的账户。
                  </p>
                </div>
              </div>
            </div>
          ) : taskStatus === 'FAILED' ? (
            /* Task failed */
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">任务失败</p>
                  <p className="mt-1 text-sm text-red-700">
                    任务已标记为失败，尾款已退回您的账户。可联系客服索赔。
                  </p>
                </div>
              </div>
            </div>
          ) : taskStatus === 'COMPLETED' ? (
            /* Task completed successfully */
            <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">任务成功完成</p>
                  <p className="mt-1 text-sm text-green-700">
                    任务已成功完成，佣金已全部支付给揭榜人。
                  </p>
                </div>
              </div>
            </div>
          ) : taskStatus === 'ENDED' ? (
            /* Task ended (rejected) */
            <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">任务结束</p>
                  <p className="mt-1 text-sm text-yellow-700">
                    任务未达标，尾款已退回您的账户。
                  </p>
                </div>
              </div>
            </div>
          ) : !hasAcceptor ? (
            <>
              {/* Waiting for acceptor */}
              <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">等待揭榜中</p>
                    <p className="mt-1 text-sm text-yellow-700">
                      任务已发布{formatDistanceToNow(new Date(post.createdAt), { locale: zhCN })}，
                      正在等待合适的揭榜人。
                    </p>
                    {daysUntilExpiration !== null && (
                      <p className="mt-1 text-xs text-orange-600 font-medium">
                        还剩{daysUntilExpiration}天过期
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tips for task owner */}
              <div className="mb-6 space-y-2">
                <h3 className="font-semibold text-gray-900">温馨提示</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 任务发布后将展示在首页动态中</li>
                  <li>• 揭榜后将自动扣除50%首付作为保证金</li>
                  <li>• 任务完成确认后将自动支付剩余50%尾款</li>
                  <li className="text-orange-600">• 30天内无人揭榜将自动过期并退款</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Has acceptor - show progress */}
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
                    <div className={`rounded-full px-3 py-1 ${
                      taskStatus === 'COMPLETED' 
                        ? 'bg-green-100'
                        : taskStatus === 'FAILED'
                          ? 'bg-red-100' 
                        : taskStatus === 'ENDED'
                          ? 'bg-gray-100'
                        : taskStatus === 'COMPLETION_REQUESTED'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                    }`}>
                      <span className={`text-xs font-medium ${
                        taskStatus === 'COMPLETED' 
                          ? 'text-green-700'
                        : taskStatus === 'FAILED'
                          ? 'text-red-700' 
                        : taskStatus === 'ENDED'
                          ? 'text-gray-700'
                        : taskStatus === 'COMPLETION_REQUESTED'
                          ? 'text-yellow-700'
                          : 'text-blue-700'
                      }`}>
                        {taskStatus === 'COMPLETED' 
                          ? '已完成'
                        : taskStatus === 'FAILED'
                          ? '失败' 
                        : taskStatus === 'ENDED'
                          ? '已结束'
                        : taskStatus === 'COMPLETION_REQUESTED'
                          ? '待确认'
                          : '执行中'}
                      </span>
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
              {taskStatus === 'COMPLETION_REQUESTED' && (
                <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-sm text-orange-800">
                    <span className="font-semibold">待确认：</span>
                    揭榜人已申请任务完成，请确认任务是否已完成。确认后将自动发放尾款。
                  </p>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {canConfirmCompletion ? (
              <>
                <div className="flex gap-2">
                  <Button
                    onPress={() => {
                      if (confirm('确认任务已完成？尾款将立即发放给揭榜者。')) {
                        handleTaskCompletionMutation.mutate('complete');
                      }
                    }}
                    loading={handleTaskCompletionMutation.isPending}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    确认完成
                  </Button>
                  <Button
                    mode="secondary"
                    onPress={() => {
                      if (confirm('任务未达标？将不发放尾款。')) {
                        handleTaskCompletionMutation.mutate('reject');
                      }
                    }}
                    loading={handleTaskCompletionMutation.isPending}
                    className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    不算成功
                  </Button>
                </div>
                <Button
                  mode="secondary"
                  onPress={() => {
                    if (confirm('确认任务失败？可联系客服索赔。')) {
                      handleTaskCompletionMutation.mutate('fail');
                    }
                  }}
                  loading={handleTaskCompletionMutation.isPending}
                  className="w-full border-red-500 text-red-600 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-1" />
                  失败索赔
                </Button>
              </>
            ) : (
              <Button
                mode="secondary"
                onPress={() => {
                  state.close();
                  onClose();
                }}
                className="w-full">
                确定
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
