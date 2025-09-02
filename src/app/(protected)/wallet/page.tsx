'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Send, Plus, Minus, Copy, Check, Coins, Coffee, ArrowUp, ArrowDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface WalletInfo {
  id: string;
  username: string;
  walletAddress: string;
  apeBalance: number;
  appessoBalance?: number; // Appesso Coffee balance
  walletCreatedAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  fromUser?: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  toUser?: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  createdAt: string;
  completedAt?: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'transfer'>('overview');
  const [activeCard, setActiveCard] = useState<'none' | 'ape' | 'coffee'>('none');
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');

  // Fetch wallet info
  const { data: wallet, isLoading: walletLoading } = useQuery<WalletInfo>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await fetch('/api/wallet');
      if (!response.ok) throw new Error('Failed to fetch wallet');
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/wallet/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!session?.user,
    refetchInterval: 5000,
  });

  // Transaction mutation
  const transactionMutation = useMutation({
    mutationFn: async (data: { type: string; amount: number; toUsername?: string; description?: string }) => {
      const response = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transaction failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setAmount('');
      setRecipient('');
      setDescription('');
      setActiveTab('overview');
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleCopyAddress = () => {
    if (wallet?.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTransaction = (type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER') => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效金额');
      return;
    }

    if (type === 'TRANSFER' && !recipient) {
      alert('请输入接收者用户名');
      return;
    }

    transactionMutation.mutate({
      type,
      amount: amountNum,
      toUsername: type === 'TRANSFER' ? recipient : undefined,
      description: description || undefined,
    });
  };

  const getTransactionIcon = (type: string, isReceived: boolean) => {
    if (type === 'DEPOSIT' || type === 'REWARD' || isReceived) {
      return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-red-500" />;
  };

  const getTransactionDescription = (transaction: Transaction) => {
    const isReceived = transaction.toUser?.id === session?.user?.id;
    
    if (transaction.type === 'TRANSFER') {
      if (isReceived) {
        return `来自 @${transaction.fromUser?.username || 'Unknown'}`;
      } else {
        return `转账给 @${transaction.toUser?.username || 'Unknown'}`;
      }
    }
    return transaction.description || transaction.type;
  };

  if (walletLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">加载钱包中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-16 items-center px-4">
          <ButtonNaked
            onPress={handleBack}
            className="mr-4 flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </ButtonNaked>
          <h1 className="text-xl font-semibold">我的钱包</h1>
        </div>
      </div>

      {/* APE Balance Card */}
      <div className="relative mx-4 mt-6">
        <div className="relative rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-4 text-4xl font-bold">
                {wallet?.apeBalance?.toFixed(2) || '0.00'}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs opacity-75">钱包地址:</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">
                    {wallet?.walletAddress ? `${wallet.walletAddress.slice(0, 6)}...${wallet.walletAddress.slice(-4)}` : ''}
                  </span>
                  <ButtonNaked onPress={handleCopyAddress} className="p-1">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </ButtonNaked>
                </div>
              </div>
            </div>
            {/* Plus button for APE */}
            <ButtonNaked
              onPress={() => {
                setActiveCard(activeCard === 'ape' ? 'none' : 'ape');
                setActiveTab('deposit');
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <Plus className="h-6 w-6 text-white" />
            </ButtonNaked>
          </div>
        </div>
      </div>

      {/* Arrow indicator between cards */}
      <div className="relative h-12">
        {activeCard !== 'none' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {activeCard === 'ape' ? (
              <ArrowUp className="h-10 w-10 text-purple-500 animate-bounce stroke-[4]" />
            ) : (
              <ArrowDown className="h-10 w-10 text-purple-500 animate-bounce stroke-[4]" />
            )}
          </div>
        )}
      </div>

      {/* Appesso Coffee Balance Card */}
      <div className="relative mx-4">
        <div className="relative rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-4 text-4xl font-bold">
                {wallet?.appessoBalance?.toFixed(2) || '0.00'}
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                <span className="text-sm opacity-90">Appesso咖啡余额</span>
              </div>
            </div>
            {/* Plus button for Coffee */}
            <ButtonNaked
              onPress={() => {
                setActiveCard(activeCard === 'coffee' ? 'none' : 'coffee');
                setActiveTab('withdraw');
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <Plus className="h-6 w-6 text-white" />
            </ButtonNaked>
          </div>
        </div>
      </div>


      {/* Transaction Form */}
      {activeTab !== 'overview' && (
        <div className="mx-4 mt-6 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {activeTab === 'deposit' && '充值 APE 币'}
              {activeTab === 'withdraw' && '提现 APE 币'}
              {activeTab === 'transfer' && '转账 APE 币'}
            </h2>
            <ButtonNaked
              onPress={() => setActiveTab('overview')}
              className="text-sm text-gray-500 hover:text-gray-700">
              取消
            </ButtonNaked>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">金额</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            {activeTab === 'transfer' && (
              <div>
                <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">接收者用户名</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">备注 (可选)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加备注..."
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <Button
              onPress={() => handleTransaction(activeTab.toUpperCase() as 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER')}
              isDisabled={transactionMutation.isPending}
              className="w-full">
              {transactionMutation.isPending ? '处理中...' : '确认'}
            </Button>

            {transactionMutation.isError && (
              <p className="text-sm text-red-500">
                {transactionMutation.error?.message || '交易失败'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="mx-4 mt-6 mb-20">
        <h2 className="mb-4 text-lg font-semibold">交易历史</h2>
        
        {transactionsLoading ? (
          <div className="text-center text-gray-500">加载中...</div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500 dark:bg-gray-800">
            暂无交易记录
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const isReceived = transaction.toUser?.id === session?.user?.id;
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      {getTransactionIcon(transaction.type, isReceived)}
                    </div>
                    <div>
                      <p className="font-medium">{getTransactionDescription(transaction)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(transaction.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isReceived ? 'text-green-500' : 'text-red-500'}`}>
                      {isReceived ? '+' : '-'}{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.status === 'PENDING' ? '处理中' : '已完成'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
