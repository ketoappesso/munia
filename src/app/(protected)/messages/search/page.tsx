'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';
import enUS from 'date-fns/locale/en-US';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ArrowLeft, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  conversation: {
    id: string;
    otherUser: {
      id: string;
      username: string;
      name: string;
      profilePhoto: string;
    };
  };
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ['messageSearch', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      const response = await fetch(`/api/messages/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to search messages');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to search messages');
      }
      return response.json();
    },
    enabled: !!session?.user && debouncedQuery.trim().length > 0,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('log in')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto mb-4 h-8 w-8 text-gray-300 animate-pulse" />
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold">{t('message.searchMessages')}</h1>
          </div>
        </div>
        
        <div className="px-4 py-12 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">{t('message.pleaseLogin')}</h2>
          <p className="text-gray-500 mb-4">{t('message.loginToSearch')}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('message.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('message.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {!searchQuery.trim() && (
          <div className="py-12 text-center text-gray-500">
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p>{t('message.enterKeyword')}</p>
            <p className="mt-2 text-sm">{t('message.searchAllConversations')}</p>
          </div>
        )}

        {searchQuery.trim() && isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-start gap-3 rounded-lg bg-gray-100 p-3">
                <div className="h-10 w-10 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-gray-300" />
                  <div className="h-3 w-3/4 rounded bg-gray-300" />
                  <div className="h-3 w-1/2 rounded bg-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery.trim() && !isLoading && error && (
          <div className="py-8 text-center">
            <div className="text-red-500 mb-2">
              <Search className="mx-auto mb-2 h-8 w-8 text-red-300" />
              <p className="font-medium">{t('message.searchFailed')}</p>
            </div>
            <p className="text-sm text-gray-600">
              {error?.message?.includes('log in') 
                ? t('message.loginRequired') 
                : error?.message || t('message.tryLater')}
            </p>
          </div>
        )}

        {searchQuery.trim() && !isLoading && !error && searchResults.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p>{t('message.noResults')}</p>
            <p className="mt-2 text-sm">{t('message.tryDifferentKeywords')}</p>
          </div>
        )}

        {searchQuery.trim() && !isLoading && !error && searchResults.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              {t('message.foundMessages').replace('{count}', searchResults.length.toString())}
            </p>
            
            {searchResults.map((result) => (
              <Link
                key={result.id}
                href={`/messages/${result.conversation.otherUser.username}`}
                className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={result.conversation.otherUser.profilePhoto || '/images/default-avatar.svg'}
                    alt={result.conversation.otherUser.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {result.conversation.otherUser.name || result.conversation.otherUser.username}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(result.createdAt), {
                          addSuffix: true,
                          locale: language === 'zh' ? zhCN : enUS,
                        })}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="text-xs text-gray-400">
                        {result.sender.name}: 
                      </span>
                      <span className="ml-1">
                        {highlightText(result.content, searchQuery)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}