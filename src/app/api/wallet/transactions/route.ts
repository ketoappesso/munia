import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

export async function GET() {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id },
        ],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
          },
        },
        toUser: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, amount, toUsername, description } = await request.json();

    // Validate transaction type
    if (!['TRANSFER', 'DEPOSIT', 'WITHDRAW'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get current user balance
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { apeBalance: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different transaction types
    if (type === 'TRANSFER') {
      if (!toUsername) {
        return NextResponse.json({ error: 'Recipient username required' }, { status: 400 });
      }

      // Check balance
      if (currentUser.apeBalance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      // Find recipient
      const recipient = await prisma.user.findUnique({
        where: { username: toUsername },
      });

      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }

      if (recipient.id === user.id) {
        return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 });
      }

      // Create transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          type: 'TRANSFER',
          amount,
          status: 'COMPLETED',
          description: description || `Transfer to @${toUsername}`,
          fromUserId: user.id,
          toUserId: recipient.id,
          completedAt: new Date(),
        },
      });

      // Update balances
      await prisma.user.update({
        where: { id: user.id },
        data: { apeBalance: { decrement: amount } },
      });

      await prisma.user.update({
        where: { id: recipient.id },
        data: { apeBalance: { increment: amount } },
      });

      return NextResponse.json(transaction);
    }

    if (type === 'DEPOSIT') {
      // Create deposit transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          type: 'DEPOSIT',
          amount,
          status: 'PENDING',
          description: description || 'Deposit APE tokens',
          toUserId: user.id,
        },
      });

      // In production, this would trigger actual blockchain interaction
      // For demo, we'll simulate instant completion
      setTimeout(async () => {
        await prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { apeBalance: { increment: amount } },
        });
      }, 2000);

      return NextResponse.json(transaction);
    }

    if (type === 'WITHDRAW') {
      // Check balance
      if (currentUser.apeBalance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      // Create withdrawal transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          type: 'WITHDRAW',
          amount,
          status: 'PENDING',
          description: description || 'Withdraw APE tokens',
          fromUserId: user.id,
        },
      });

      // In production, this would trigger actual blockchain interaction
      // For demo, we'll simulate instant completion
      setTimeout(async () => {
        await prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { apeBalance: { decrement: amount } },
        });
      }, 2000);

      return NextResponse.json(transaction);
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
