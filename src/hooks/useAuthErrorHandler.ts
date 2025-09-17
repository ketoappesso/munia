import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { signOut } from 'next-auth/react';

export function useAuthErrorHandler() {
  const router = useRouter();

  const handleAuthError = useCallback(async (error: any) => {
    // Check if it's an authentication error
    if (
      error?.status === 401 ||
      error?.message?.includes('401') ||
      error?.message?.includes('Unauthorized') ||
      error?.message?.includes('User not authenticated')
    ) {
      // Clear the session and redirect to login
      await signOut({ redirect: false });
      router.push('/login');
      return true;
    }
    return false;
  }, [router]);

  const checkResponseAuth = useCallback(async (response: Response) => {
    if (response.status === 401) {
      await signOut({ redirect: false });
      router.push('/login');
      return false;
    }
    return true;
  }, [router]);

  return {
    handleAuthError,
    checkResponseAuth
  };
}