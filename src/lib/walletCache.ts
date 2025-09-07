interface WalletCacheData {
  balance: number;
  subsidy: number;
  lastUpdated: string;
}

const WALLET_CACHE_KEY = 'wallet_balance_cache';

export const walletCache = {
  // 获取缓存的钱包数据
  get(): WalletCacheData | null {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(WALLET_CACHE_KEY);
    if (!cached) return null;
    
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  },

  // 保存钱包数据到缓存
  set(balance: number, subsidy: number = 0): void {
    if (typeof window === 'undefined') return;
    
    const data: WalletCacheData = {
      balance,
      subsidy,
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(data));
  },

  // 清除缓存
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(WALLET_CACHE_KEY);
  },

  // 格式化上次更新时间
  formatLastUpdated(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚更新';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    // 显示具体日期
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  },
};