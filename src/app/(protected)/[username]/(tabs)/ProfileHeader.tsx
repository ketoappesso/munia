'use client';

import { ProfileActionButtons } from '@/components/ProfileActionButtons';
import { GetUser } from '@/types/definitions';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import Link from 'next/link';
import { Ellipse } from '@/svg_components';
import { ButtonLink } from '@/components/ui/ButtonLink';
import Tabs from './Tabs';
import CoverPhoto from './CoverPhoto';
import ProfilePhoto from './ProfilePhoto';
import HamburgerMenu from '@/svg_components/HamburgerMenu';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { useState, useCallback, useEffect } from 'react';
import ProfilePunkIndicator from '@/components/ProfilePunkIndicator';
import { usePunk } from '@/contexts/PunkContext';

export function ProfileHeader({
  isOwnProfile,
  initialProfileData,
}: {
  isOwnProfile: boolean;
  initialProfileData: GetUser;
}) {
  const { data } = useUserQuery(initialProfileData.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const { isPunkedActive } = usePunk();
  const [punkedCount, setPunkedCount] = useState<number>(0);

  // Fetch punked followers count for this specific user
  useEffect(() => {
    if (initialProfileData?.id) {
      fetch(`/api/users/${initialProfileData.id}/punked-followers`)
        .then(res => res.json())
        .then(data => setPunkedCount(data.count || 0))
        .catch(err => console.error('Failed to fetch punked followers count:', err));
    }
  }, [initialProfileData?.id]);
  
  // If there is no query of the user data yet, use the
  // `initialProfileData` that was fetched on server.
  const profile = data || initialProfileData;

  return (
    <>
      <div className="relative mb-[88px] md:pt-6">
        {/* Hamburger Menu Button - positioned absolute within the header */}
        <div className="absolute right-4 top-4 z-40 md:right-6 md:top-6">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-100 dark:bg-gray-900/80 dark:hover:bg-gray-800">
            <HamburgerMenu className="h-5 w-5 stroke-gray-700 dark:stroke-gray-300" />
          </button>
        </div>
        <div className="h-60 overflow-hidden bg-muted/30 drop-shadow-xl md:rounded-3xl">
          <CoverPhoto isOwnProfile={isOwnProfile} photoUrl={profile.coverPhoto} />
        </div>
        <ProfilePhoto isOwnProfile={isOwnProfile} photoUrl={profile.profilePhoto} name={initialProfileData.name!} />
        <div className="absolute -bottom-20 right-2 md:right-0">
          {isOwnProfile ? (
            <div className="flex items-center gap-2">
              {isPunkedActive && <ProfilePunkIndicator />}
              <ButtonLink 
                shape="pill" 
                mode="default"
                href="/my-ai"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-none"
              >
                我的AI
              </ButtonLink>
            </div>
          ) : (
            <ProfileActionButtons targetUserId={profile.id} />
          )}
        </div>
      </div>

      <div className="px-4 pt-2">
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="-mt-1 mb-2 text-muted-foreground">@{profile.username}</p>
        <p className="text-foreground/80">{profile.bio}</p>
        <div className="flex flex-row items-center gap-3">
          <Link
            href={`/${profile.username}/followers`}
            className="link"
            title={`${initialProfileData.name} 的粉丝`}>
            <span className="font-semibold">{profile.followerCount}</span>{' '}
            <span className="font-medium text-muted-foreground">粉丝</span>
          </Link>
          <Ellipse className="h-1 w-1 fill-foreground" />
          <Link
            href={`/${profile.username}/following`}
            className="link"
            title={`${initialProfileData.name} 关注的人`}>
            <span className="font-semibold">{profile.followingCount}</span>{' '}
            <span className="font-medium text-muted-foreground">关注</span>
          </Link>
          <Ellipse className="h-1 w-1 fill-foreground" />
          <Link
            href={`/${profile.username}/punked`}
            className="link"
            title="punk我 用户">
            <span className="font-semibold">{punkedCount}</span>{' '}
            <span className="font-medium text-muted-foreground">punk我</span>
          </Link>
        </div>
        <Tabs isOwnProfile={isOwnProfile} />
      </div>

      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        isOwnProfile={isOwnProfile}
        username={profile.username}
      />
    </>
  );
}
