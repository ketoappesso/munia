'use client';

import { useOfflineQueueProcessor } from '@/hooks/useOfflineQueueProcessor';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

export function OfflineQueueProcessor() {
  useOfflineQueueProcessor();
  useRealTimeUpdates();
  return null;
}
