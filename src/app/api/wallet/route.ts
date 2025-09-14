import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { createPospalClient } from '@/lib/pospal/client';

export async function GET() {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's wallet information including cached Appesso balance
    const walletInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        apeBalance: true,
        walletCreatedAt: true,
        appessoBalance: true,
        appessoBalanceUpdatedAt: true,
      },
    });

    // If wallet doesn't exist yet, create one
    if (!walletInfo?.walletAddress) {
      // Generate a mock wallet address (in production, this would be a real blockchain address)
      const walletAddress = `0x${Buffer.from(user.id).toString('hex').padEnd(40, '0').substring(0, 40)}`;
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          walletAddress,
          walletCreatedAt: new Date(),
          apeBalance: 5, // Give initial bonus APE tokens
        },
        select: {
          id: true,
          username: true,
          walletAddress: true,
          apeBalance: true,
          walletCreatedAt: true,
          phoneNumber: true,
        },
      });

      // Create initial bonus transaction
      await prisma.walletTransaction.create({
        data: {
          type: 'REWARD',
          amount: 5,
          status: 'COMPLETED',
          description: 'Welcome bonus - 5 APE tokens',
          toUserId: user.id,
          completedAt: new Date(),
        },
      });

      // Don't fetch Appesso balance on wallet creation to minimize API calls
      return NextResponse.json({
        ...updatedUser,
        appessoBalance: 0, // Return 0 for new wallets, user can manually refresh
      });
    }

    // Return cached Appesso balance if available
    // User can manually refresh via the appesso-balance endpoint
    return NextResponse.json({
      ...walletInfo,
      appessoBalance: walletInfo.appessoBalance || 0, // Return cached balance or 0
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet information' }, { status: 500 });
  }
}
