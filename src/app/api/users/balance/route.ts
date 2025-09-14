import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

export async function GET() {
  try {
    // Get session using NextAuth
    const session = await auth();
    
    console.log('Session in /api/users/balance:', session);

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user balance
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        apeBalance: true,
        phoneNumber: true,
      },
    });

    if (!userData) {
      console.log('User not found in database:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User balance fetched:', { 
      id: userData.id, 
      username: userData.username,
      phoneNumber: userData.phoneNumber,
      apeBalance: userData.apeBalance 
    });

    return NextResponse.json({ 
      balance: userData.apeBalance,
      username: userData.username 
    });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user balance' },
      { status: 500 }
    );
  }
}
