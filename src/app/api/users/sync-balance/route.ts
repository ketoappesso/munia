import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET() {
  try {
    // For testing, directly look up the user
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: '14474744444' },
          { phoneNumber: '14474744444' }
        ]
      }
    });
      
      if (testUser) {
        // Calculate actual balance from wallet transactions
        const transactions = await prisma.walletTransaction.findMany({
          where: {
            OR: [
              { toUserId: testUser.id },
              { fromUserId: testUser.id }
            ],
            status: 'COMPLETED'
          }
        });
        
        let calculatedBalance = 0;
        for (const tx of transactions) {
          if (tx.toUserId === testUser.id) {
            calculatedBalance += tx.amount;
          }
          if (tx.fromUserId === testUser.id) {
            calculatedBalance -= tx.amount;
          }
        }
        
        // Get current stored balance
        const currentBalance = testUser.apeBalance;
        
        return NextResponse.json({
          userId: testUser.id,
          username: testUser.username,
          storedBalance: currentBalance,
          calculatedBalance: calculatedBalance,
          discrepancy: currentBalance - calculatedBalance,
          transactionCount: transactions.length
        });
      }
      
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error syncing balance:', error);
    return NextResponse.json(
      { error: 'Failed to sync balance' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { forceUsername = '14474744444' } = body;
    
    // For testing purposes, look up user by username
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: forceUsername },
          { phoneNumber: forceUsername }
        ]
      }
    });
    
    const userId = testUser?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate actual balance from wallet transactions
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { toUserId: userId },
          { fromUserId: userId }
        ],
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    let calculatedBalance = 0;
    const transactionLog = [];
    
    for (const tx of transactions) {
      let change = 0;
      if (tx.toUserId === userId) {
        change = tx.amount;
        calculatedBalance += tx.amount;
      }
      if (tx.fromUserId === userId) {
        change = -tx.amount;
        calculatedBalance -= tx.amount;
      }
      
      transactionLog.push({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        change: change,
        runningBalance: calculatedBalance,
        description: tx.description,
        createdAt: tx.createdAt
      });
    }
    
    // Update the user's balance to the calculated amount
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        apeBalance: Math.max(0, calculatedBalance) // Ensure non-negative
      }
    });
    
    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      username: updatedUser.username,
      previousBalance: updatedUser.apeBalance,
      newBalance: calculatedBalance,
      transactionCount: transactions.length,
      transactionLog: transactionLog
    });
  } catch (error) {
    console.error('Error syncing balance:', error);
    return NextResponse.json(
      { error: 'Failed to sync balance' },
      { status: 500 }
    );
  }
}
