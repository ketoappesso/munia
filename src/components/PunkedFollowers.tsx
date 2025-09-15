'use client';

import { useEffect, useState } from 'react';
import ProfileBlockWithActions from './ProfileBlockWithActions';
import { Loader } from '@/svg_components';

interface PunkedUser {
  id: number;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  profilePhoto: string | null;
  punked: boolean;
  ttsVoiceId: string | null;
}

export function PunkedFollowers({ userId }: { userId: number }) {
  const [users, setUsers] = useState<PunkedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}/punked-followers`)
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch punked followers:', err);
        setError('Failed to load punked followers');
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        还没有定制语音用户关注
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map(user => (
        <ProfileBlockWithActions
          key={user.id}
          userId={user.id.toString()}
          username={user.username}
          name={user.name || user.username}
          time=""
          photoUrl={user.profilePhoto || user.avatarUrl || ''}
        />
      ))}
    </div>
  );
}