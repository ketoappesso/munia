'use client';

import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline?: number;
  lastOffline?: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus({
        isOnline: true,
        isOffline: false,
        lastOnline: Date.now(),
      });
    };

    const handleOffline = () => {
      setStatus({
        isOnline: false,
        isOffline: true,
        lastOffline: Date.now(),
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}