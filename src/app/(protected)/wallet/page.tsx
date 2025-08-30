'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, DollarSign, Coins, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ButtonNaked } from '@/components/ui/ButtonNaked';

interface WalletBalance {
  cny: number;
  usdt: number;
  ape: number;
}

export default function WalletPage() {
  const router = useRouter();

  // Mock data - replace with real API call
  const balances: WalletBalance = {
    cny: 1250.5,
    usdt: 500.75,
    ape: 1200.25,
  };

  const handleBack = () => {
    router.back();
  };

  const handleRecharge = (currency: 'cny' | 'usdt' | 'ape') => {
    console.log(`Recharge ${currency}`);
    // Implement recharge logic
  };

  const handleWithdraw = (currency: 'cny' | 'usdt' | 'ape') => {
    console.log(`Withdraw ${currency}`);
    // Implement withdraw logic
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center">
          <ButtonNaked
            onPress={handleBack}
            className="mr-3 rounded-full p-2 hover:bg-foreground/5"
            aria-label="Go back">
            <ArrowLeft className="h-5 w-5 stroke-foreground" />
          </ButtonNaked>
          <h1 className="text-xl font-semibold text-foreground">Wallet</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 p-4">
        {/* Total Balance Card */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg">
          <div className="mb-4 flex items-center">
            <Wallet className="mr-2 h-6 w-6" />
            <span className="text-sm font-medium">Total Balance</span>
          </div>
          <div className="mb-2 text-3xl font-bold">¥{balances.cny.toLocaleString()}</div>
          <div className="text-sm opacity-90">≈ ${(balances.usdt * 7.2).toLocaleString()} USD</div>
        </div>

        {/* Currency Balances */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Currency Balances</h2>

          {/* CNY */}
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                <span className="font-medium text-foreground">CNY</span>
              </div>
              <span className="text-xl font-bold text-foreground">¥{balances.cny.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onPress={() => handleRecharge('cny')}>
                Recharge
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onPress={() => handleWithdraw('cny')}>
                Withdraw
              </Button>
            </div>
          </div>

          {/* USDT */}
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                <span className="font-medium text-foreground">USDT</span>
              </div>
              <span className="text-xl font-bold text-foreground">{balances.usdt.toLocaleString()} USDT</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onPress={() => handleRecharge('usdt')}>
                Recharge
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onPress={() => handleWithdraw('usdt')}>
                Withdraw
              </Button>
            </div>
          </div>

          {/* APE */}
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <Coins className="mr-2 h-5 w-5 text-yellow-600" />
                <span className="font-medium text-foreground">APE</span>
              </div>
              <span className="text-xl font-bold text-foreground">{balances.ape.toLocaleString()} APE</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onPress={() => handleRecharge('ape')}>
                Recharge
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onPress={() => handleWithdraw('ape')}>
                Withdraw
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Transactions (Placeholder) */}
        <div className="rounded-xl bg-card p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Transactions</h3>
          <div className="py-8 text-center text-muted-foreground">
            <p>No recent transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
