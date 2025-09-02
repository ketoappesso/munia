'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function SessionRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // If user is not authenticated and trying to access a protected route
    if (status === 'unauthenticated' && pathname?.startsWith('/')) {
      // Check if it's a protected route (not login, register, or public pages)
      const publicRoutes = ['/login', '/register', '/', '/feed', '/terms', '/privacy-policy'];
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
      
      if (!isPublicRoute) {
        // Clear any stale data and redirect to login
        router.replace('/login');
      }
    }
    
    // If session changes (user logs out/in), refresh the page data
    if (status === 'authenticated' && session?.user) {
      // Check if trying to access a non-existent user profile
      if (pathname?.includes('/') && pathname !== '/' && !pathname.includes('/feed')) {
        // Validate the current path
        const username = pathname.split('/')[1];
        if (username && username !== session.user.username && username !== session.user.id) {
          // If the username in the URL doesn't match current user and it's not a valid profile
          // Let the server-side check handle this
        }
      }
    }
  }, [status, session, pathname, router]);
  
  return null;
}
