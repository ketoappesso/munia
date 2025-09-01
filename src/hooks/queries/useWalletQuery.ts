import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface WalletInfo {
  id: string;
  username: string;
  walletAddress: string;
  apeBalance: number;
  walletCreatedAt: string;
}

export function useWalletQuery() {
  const { data: session } = useSession();

  return useQuery<WalletInfo>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await fetch('/api/wallet');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }
      return response.json();
    },
    enabled: !!session?.user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
