'use client';

import { useSession } from 'next-auth/react';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className = '' }: FloatingActionButtonProps) {
  const { data: session } = useSession();
  const { launchCreatePost } = useCreatePostModal();
  const router = useRouter();

  const handleCreatePost = useCallback(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    launchCreatePost({});
  }, [launchCreatePost, session?.user, router]);

  return (
    <div className={`fixed bottom-20 right-6 z-50 md:bottom-6 ${className}`}>
      <Button
        shape="circle"
        size="xl"
        onPress={handleCreatePost}
        className="h-14 w-14 transform rounded-full bg-black text-white shadow-xl transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-black dark:bg-white dark:text-black dark:focus:ring-white"
        aria-label="Create new post">
        <Plus className="h-6 w-6" strokeWidth={3} />
      </Button>
    </div>
  );
}
