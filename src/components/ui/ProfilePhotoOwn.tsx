'use client';

import { useSessionUserData } from '@/hooks/useSessionUserData';
import { ProfilePhoto } from './ProfilePhoto';

export function ProfilePhotoOwn() {
  const [user] = useSessionUserData();

  // Always render ProfilePhoto to maintain consistent hooks, but with conditional props
  return <ProfilePhoto 
    name={user?.name || ''} 
    username={user?.username || ''} 
    photoUrl={user?.profilePhoto} 
  />;
}
