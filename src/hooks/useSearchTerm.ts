'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Custom hook to extract search term from URL
 */
export function useSearchTerm() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  return search;
}
