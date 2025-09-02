import prisma from '@/lib/prisma/prisma';
import { GetUser } from '@/types/definitions';

export async function getProfile(username: string) {
  try {
    // Validate username
    if (!username || username.trim() === '') {
      return null;
    }
    
    // Get the id of the user from the given username.
    const check = await prisma.user.findFirst({
      where: {
        username: username.trim(),
      },
      select: {
        id: true,
      },
    });

    if (!check) return null;

    // Use the id to fetch from the /api/users/:userId endpoint
    // In server components, we need to use absolute URLs
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3002';
    const res = await fetch(`${baseUrl}/api/users/${check.id}`, {
      // Add cache control to prevent stale data
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      console.error(`Error fetching profile for username: ${username}, status: ${res.status}`);
      return null;
    }
    
    const user: GetUser = await res.json();
    return user;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}
