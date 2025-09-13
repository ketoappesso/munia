'use client';

import { Feather, GridFeedCards, NotificationBell, Profile } from '@/svg_components';
import { useSessionUserData } from '@/hooks/useSessionUserData';
import { useMessagesUnreadCountQuery } from '@/hooks/queries/useMessagesUnreadCountQuery';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogoText } from './LogoText';
import { MenuBarItem } from './MenuBarItem';
import { Shield, Users } from 'lucide-react';

const ADMIN_PHONE = '18874748888';

export function MenuBar() {
  const [user] = useSessionUserData();
  const { data: session } = useSession();
  const username = user?.username || 'user-not-found';
  const { data: messagesUnreadCount } = useMessagesUnreadCountQuery();

  // Check if user is admin (username matches admin phone)
  const isAdmin = session?.user?.username === ADMIN_PHONE;

  return (
    <div className="fixed bottom-0 z-[2] flex w-full bg-background/70 shadow-inner backdrop-blur-sm md:sticky md:top-0 md:h-screen md:w-[212px] md:flex-col md:items-start md:bg-inherit md:p-4 md:shadow-none md:backdrop-blur-none">
      <Link href="/" title="Home" className="mb-4 hidden items-center gap-2 md:flex">
        <Feather className="h-12 w-12 stroke-primary" />

        <LogoText className="text-3xl" />
      </Link>
      {[
        {
          title: 'Feed',
          Icon: GridFeedCards,
          route: '/feed',
        },
        {
          title: 'Messages',
          Icon: NotificationBell,
          route: '/messages',
          badge: messagesUnreadCount,
        },
        { title: 'My Profile', Icon: Profile, route: `/${username}` },
        // My Space - available for all authenticated users
        {
          title: '我的空间',
          Icon: Users,
          route: '/my-space',
        },
        // Admin Backoffice - only for admin
        ...(isAdmin
          ? [
              {
                title: '我的后台',
                Icon: Shield,
                route: '/backoffice',
              },
            ]
          : []),
      ].map((item) => (
        <MenuBarItem key={item.title} {...item}>
          {item.title}
        </MenuBarItem>
      ))}
    </div>
  );
}
