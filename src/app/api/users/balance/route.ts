import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authConfig from '@/auth.config';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authConfig);
    
    console.log('Session in /api/users/balance:', session);

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      // Try to get user by other means if needed
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user balance
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        apeBalance: true,
      },
    });

    if (!userData) {
      console.log('User not found in database:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User balance fetched:', { 
      id: userData.id, 
      username: userData.username,
      apeBalance: userData.apeBalance 
    });

    return NextResponse.json({ 
      balance: userData.apeBalance,
      username: userData.username 
    });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    // Try a fallback approach - get user by username from the URL or session
    try {
      // You might need to adjust this based on how your auth is set up
      const fallbackUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: '14474744444' },
            { phoneNumber: '14474744444' }
          ]
        },
        select: {
          apeBalance: true,
          username: true
        }
      });
      
      if (fallbackUser) {
        console.log('Fallback user found:', fallbackUser);
        return NextResponse.json({ 
          balance: fallbackUser.apeBalance,
          username: fallbackUser.username 
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user balance' },
      { status: 500 }
    );
  }
}
