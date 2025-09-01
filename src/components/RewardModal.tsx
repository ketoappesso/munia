'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ButtonNaked } from '@/components/ui/ButtonNaked';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (amount: number) => void;
  currentBalance: number;
}

export function RewardModal({ isOpen, onClose, onSelect, currentBalance }: RewardModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);

  const presetAmounts = [10, 20, 50, 100, 200, 500];

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setUseCustom(false);
    setCustomAmount('');
  };

  const handleConfirm = () => {
    const amount = useCustom ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount <= 0) return;
    if (amount > currentBalance) return;
    onSelect(amount);
  };

  const finalAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount;
  const isValid = finalAmount > 0 && finalAmount <= currentBalance;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-6 shadow-xl dark:bg-gray-800 sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            
            {/* Drag Handle for mobile */}
            <div className="mb-4 flex justify-center sm:hidden">
              <div className="h-1 w-12 rounded-full bg-gray-300" />
            </div>
            
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">设置悬赏金额</h2>
              <ButtonNaked onPress={onClose} className="p-1">
                <X className="h-5 w-5" />
              </ButtonNaked>
            </div>

            {/* Current Balance */}
            <div className="mb-6 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">当前余额</span>
                </div>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{currentBalance.toFixed(0)} APE</span>
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">选择金额</p>
              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleSelectPreset(amount)}
                    disabled={amount > currentBalance}
                    className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      selectedAmount === amount && !useCustom
                        ? 'border-purple-600 bg-purple-50 text-purple-600 dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-400'
                        : amount > currentBalance
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
                        : 'border-gray-200 hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-500'
                    }`}>
                    {amount} APE
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">或输入自定义金额</p>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setUseCustom(true);
                  setSelectedAmount(0);
                }}
                placeholder="输入金额..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Warning */}
            {finalAmount > currentBalance && finalAmount > 0 && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">余额不足</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pb-safe">
              <Button
                variant="outline"
                onPress={onClose}
                className="flex-1 py-3">
                取消
              </Button>
              <Button
                onPress={handleConfirm}
                isDisabled={!isValid}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-medium">
                确认 {finalAmount > 0 && `(${finalAmount} APE)`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
