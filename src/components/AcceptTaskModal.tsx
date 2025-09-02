'use client';

import { useEffect } from 'react';
import { useOverlayTriggerState } from 'react-stately';
import { Modal } from './Modal';
import Button from './ui/Button';
import { Trophy, AlertCircle, Clock, Shield } from 'lucide-react';
import { GetPost } from '@/types/definitions';

interface AcceptTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  post: GetPost;
  isAccepting?: boolean;
}

export function AcceptTaskModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  post,
  isAccepting = false 
}: AcceptTaskModalProps) {
  const state = useOverlayTriggerState({ isOpen, onOpenChange: (open) => !open && onClose() });
  
  useEffect(() => {
    if (isOpen && !state.isOpen) {
      state.open();
    } else if (!isOpen && state.isOpen) {
      state.close();
    }
  }, [isOpen]);

  if (!state.isOpen) return null;
  
  return (
    <Modal state={state}>
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">确认揭榜</h2>
            <p className="text-sm text-gray-500">悬赏金额: {post.rewardAmount} APE</p>
          </div>
        </div>

        {/* Task Description */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold text-gray-900">任务描述</h3>
          <p className="text-gray-700">{post.content}</p>
        </div>

        {/* Rules */}
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900">揭榜规则</h3>
          
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">平台保障</p>
              <p className="text-xs text-gray-600">
                佣金由平台托管，任务完成后自动转账
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">3日保护期</p>
              <p className="text-xs text-gray-600">
                3日后求助人认为没获得帮助可申请退回佣金
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">自动建群</p>
              <p className="text-xs text-gray-600">
                揭榜后将自动创建求助人、小猿助手、揭榜人三方群聊
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">重要提示：</span>
            揭榜后需认真完成任务，恶意揭榜将影响您的信用评分
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onPress={() => {
              state.close();
              onClose();
            }}
            disabled={isAccepting}
            className="flex-1">
            放弃
          </Button>
          <Button
            onPress={onAccept}
            loading={isAccepting}
            disabled={isAccepting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
            {isAccepting ? '揭榜中...' : '确认揭榜'}
          </Button>
        </div>
        </div>
      </div>
    </Modal>
  );
}
