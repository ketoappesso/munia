import { getServerUser } from '@/lib/getServerUser';
import React from 'react';
import { ProfileHeader } from './ProfileHeader';
import { getProfile } from '../getProfile';
import { redirect } from 'next/navigation';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const [user] = await getServerUser();

  // Redirect non-authenticated users to login
  if (!user) {
    redirect('/login');
  }

  // Only fetch profile if user is authenticated
  const profile = await getProfile(params.username);
  
  // If profile doesn't exist, show error page
  if (!profile) {
    // If logged in and trying to access own profile with invalid username, redirect to home
    if (user && (params.username === user.username || params.username === user.id)) {
      redirect('/');
    }
    
    // For other users, show a proper error page
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">用户不存在</h2>
          <p className="text-gray-600 mb-4">该用户不存在或已更改用户名</p>
          <a 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }
  
  const isOwnProfile = profile.id === user?.id;

  return (
    <div className="pb-0">
      <div className="pr-0 md:pr-4">
        <ProfileHeader isOwnProfile={isOwnProfile} initialProfileData={profile} />
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}
