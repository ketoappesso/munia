import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { createPospalClient } from '@/lib/pospal/client';

export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's wallet information
    const walletInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        apeBalance: true,
        walletCreatedAt: true,
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
          apeBalance: 100, // Give initial bonus APE tokens
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
          amount: 100,
          status: 'COMPLETED',
          description: 'Welcome bonus - 100 APE tokens',
          toUserId: user.id,
          completedAt: new Date(),
        },
      });

      // Fetch Appesso balance
      let appessoBalance = 0;
      try {
        if (updatedUser.phoneNumber) {
          const pospalClient = createPospalClient(); // Main store only
          appessoBalance = await pospalClient.getCustomerBalance(updatedUser.phoneNumber);
        }
      } catch (error) {
        console.log('Failed to fetch Appesso balance:', error);
      }

      return NextResponse.json({
        ...updatedUser,
        appessoBalance,
      });
    }

    // Fetch Appesso balance for existing wallet
    let appessoBalance = 0;
    try {
      const userPhone = await prisma.user.findUnique({
        where: { id: user.id },
        select: { phoneNumber: true },
      });
      
      if (userPhone?.phoneNumber) {
        const pospalClient = createPospalClient(); // Main store only
        appessoBalance = await pospalClient.getCustomerBalance(userPhone.phoneNumber);
      }
    } catch (error) {
      console.log('Failed to fetch Appesso balance:', error);
    }

    return NextResponse.json({
      ...walletInfo,
      appessoBalance,
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet information' }, { status: 500 });
  }
}
