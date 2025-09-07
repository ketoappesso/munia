'use client';

import { GridFeedCards, NotificationBell, Profile } from '@/svg_components';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessagesUnreadCountQuery } from '@/hooks/queries/useMessagesUnreadCountQuery';
import { MenuBarItem } from './MenuBarItem';

export function BottomNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { data: messagesUnreadCount } = useMessagesUnreadCountQuery();
  
  const username = (session?.user as any)?.username || 'user-not-found';

  const navItems = [
    {
      title: t('nav.feed'),
      Icon: GridFeedCards,
      route: '/feed',
    },
    {
      title: t('nav.messages'),
      Icon: NotificationBell,
      route: '/messages',
      badge: messagesUnreadCount,
    },
    { 
      title: t('nav.profile'), 
      Icon: Profile, 
      route: `/${username}` 
    },
  ];

  return (
    <div className="fixed bottom-0 z-[2] flex w-full bg-background/70 shadow-inner backdrop-blur-sm md:hidden">
      {navItems.map((item) => (
        <MenuBarItem key={item.title} {...item}>
          {item.title}
        </MenuBarItem>
      ))}
    </div>
  );
}