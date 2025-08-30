'use client';

import { CreatePostModalLauncher } from '@/components/CreatePostModalLauncher';
import { Posts } from '@/components/Posts';
import { useSession } from 'next-auth/react';
import { AuthModal } from '@/components/AuthModal';
import { useCallback, useState } from 'react';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export default function Page() {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const handleCloseAuthModal = useCallback(() => setShowAuthModal(false), []);

  if (status === 'loading') {
    return (
      <div className="px-4 pt-4">
        <div className="mb-4">
          <h1 className="text-4xl font-bold">Feed</h1>
        </div>
        <div className="py-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-4xl font-bold">Feed</h1>
      </div>

      {session?.user ? (
        <>
          <CreatePostModalLauncher />
          <Posts type="feed" userId={session.user.id} />
        </>
      ) : (
        <Posts type="public" />
      )}

      <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
    </div>
  );
}
