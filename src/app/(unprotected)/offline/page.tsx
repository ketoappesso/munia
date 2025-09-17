'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">连接已恢复</h1>
          <p className="text-muted-foreground">您的网络连接已恢复，现在可以继续使用Appesso了。</p>
          <Link
            href="/feed"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            返回应用
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 6v6m0 4h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">您当前离线</h1>
        <p className="text-muted-foreground">
          无法连接到网络。您仍然可以查看之前浏览过的内容。
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            重试连接
          </button>
          <Link
            href="/feed"
            className="block w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            查看缓存内容
          </Link>
        </div>
        <div className="text-sm text-muted-foreground mt-8">
          <p>离线时您可以：</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• 查看之前加载的帖子</li>
            <li>• 浏览个人资料页面</li>
            <li>• 查看已缓存的图片</li>
          </ul>
        </div>
      </div>
    </div>
  );
}