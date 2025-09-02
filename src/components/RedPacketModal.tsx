'use client';

import { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface RedPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (amount: number, message?: string) => void;
  userBalance: number;
  recipientName: string;
}

export function RedPacketModal({ 
  isOpen, 
  onClose, 
  onSend, 
  userBalance,
  recipientName 
}: RedPacketModalProps) {
  console.log('RedPacketModal rendered with props:', { isOpen, userBalance, recipientName });
  
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('恭喜发财，大吉大利！');
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleSend = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || numAmount <= 0) {
      setError('请输入有效金额');
      return;
    }
    
    if (numAmount > userBalance) {
      setError(`余额不足，当前余额: ${userBalance} APE`);
      return;
    }
    
    onSend(numAmount, message || undefined);
    setAmount('');
    setMessage('恭喜发财，大吉大利！');
    setError('');
  };

  const handleClose = () => {
    setAmount('');
    setMessage('恭喜发财，大吉大利！');
    setError('');
    onClose();
  };

  if (!isOpen || !mounted) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div 
        className="w-full max-w-md rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-1"
        onClick={(e) => e.stopPropagation()}>
        <div className="rounded-2xl bg-white">
          {/* Header */}
          <div className="relative rounded-t-2xl bg-gradient-to-br from-red-500 to-red-600 px-6 py-8 text-center">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">发红包</h2>
            <p className="mt-2 text-sm text-white/90">给 {recipientName}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Amount Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                金额 (APE)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-2xl font-bold text-center focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-500">
                  APE
                </span>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <p className="mt-2 text-sm font-medium text-gray-600">
                可用余额: <span className="text-lg text-gray-900">{userBalance.toFixed(2)}</span> APE
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[1, 5, 10].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setAmount(val.toString());
                    setError('');
                  }}
                  className="rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {val} APE
                </button>
              ))}
            </div>

            {/* Message Input */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                祝福语 (可选)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="恭喜发财，大吉大利！"
                maxLength={50}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button
                onClick={handleSend}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 py-2 text-sm font-medium text-white hover:from-red-600 hover:to-red-700">
                发送红包
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
