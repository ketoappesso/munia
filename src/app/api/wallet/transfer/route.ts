import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { createPospalClient } from '@/lib/pospal/client';
import { z } from 'zod';

// Validation schema
const transferSchema = z.object({
  direction: z.enum(['TO_APPESSO', 'FROM_APPESSO']),
  amount: z.number().positive().min(0.01),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = transferSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { direction, amount, description } = validation.data;

    // Get user information including phone number
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        apeBalance: true,
        walletAddress: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userInfo.phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not linked. Please update your profile with your phone number.' },
        { status: 400 }
      );
    }

    // Create Pospal client
    const pospalClient = createPospalClient();

    // Get customer information from Pospal
    const customer = await pospalClient.queryCustomerByPhone(userInfo.phoneNumber);

    if (!customer) {
      return NextResponse.json(
        { error: 'Appesso account not found. Please ensure your phone number is registered with Appesso.' },
        { status: 404 }
      );
    }

    const customerUid = customer.customerUid;
    const currentAppessoBalance = customer.balance + (customer.extInfo?.subsidyAmount || 0);

    // Handle transfer based on direction
    if (direction === 'TO_APPESSO') {
      // Transfer from Appesso (APE) to Appesso
      if (userInfo.apeBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient APE balance' },
          { status: 400 }
        );
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct APE balance
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            apeBalance: {
              decrement: amount,
            },
          },
        });

        // Record transaction in database
        const transaction = await tx.walletTransaction.create({
          data: {
            type: 'TRANSFER',
            amount,
            status: 'PENDING',
            description: description || `Transfer to Appesso: ¥${amount}`,
            fromUserId: user.id,
          },
        });

        // Add balance to Appesso account
        const success = await pospalClient.updateBalanceAndPoints(
          customerUid,
          amount, // Positive amount to add
          0, // No points change
          `Transfer from Appesso wallet by ${userInfo.username}`
        );

        if (!success) {
          throw new Error('Failed to update Appesso balance');
        }

        // Update transaction status
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        return {
          success: true,
          transaction: {
            id: transaction.id,
            type: 'TRANSFER',
            amount,
            direction: 'TO_APPESSO',
            status: 'COMPLETED',
          },
          balances: {
            apeBalance: updatedUser.apeBalance,
            appessoBalance: currentAppessoBalance + amount,
          },
        };
      });

      return NextResponse.json(result);

    } else if (direction === 'FROM_APPESSO') {
      // Transfer from Appesso to Appesso (APE)
      if (currentAppessoBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient Appesso balance' },
          { status: 400 }
        );
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Record transaction in database
        const transaction = await tx.walletTransaction.create({
          data: {
            type: 'TRANSFER',
            amount,
            status: 'PENDING',
            description: description || `Transfer from Appesso: ¥${amount}`,
            toUserId: user.id,
          },
        });

        // Deduct balance from Appesso account
        const success = await pospalClient.updateBalanceAndPoints(
          customerUid,
          -amount, // Negative amount to deduct
          0, // No points change
          `Transfer to Appesso wallet by ${userInfo.username}`
        );

        if (!success) {
          throw new Error('Failed to update Appesso balance');
        }

        // Add APE balance
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            apeBalance: {
              increment: amount,
            },
          },
        });

        // Update transaction status
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        return {
          success: true,
          transaction: {
            id: transaction.id,
            type: 'TRANSFER',
            amount,
            direction: 'FROM_APPESSO',
            status: 'COMPLETED',
          },
          balances: {
            apeBalance: updatedUser.apeBalance,
            appessoBalance: currentAppessoBalance - amount,
          },
        };
      });

      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Error processing transfer:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check if it's a known error
    if (error instanceof Error) {
      if (error.message.includes('Appesso')) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: error.message || 'Failed to process transfer' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}

// GET endpoint to check transfer eligibility (uses cached balance)
export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user information including cached Appesso balance
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        phoneNumber: true,
        apeBalance: true,
        appessoBalance: true,
        appessoBalanceUpdatedAt: true,
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userInfo.phoneNumber) {
      return NextResponse.json({
        eligible: false,
        reason: 'Phone number not linked',
        apeBalance: userInfo.apeBalance,
      });
    }

    // Use cached balance if available for eligibility check
    // This avoids unnecessary Pospal API calls
    if (userInfo.appessoBalance !== null) {
      return NextResponse.json({
        eligible: true,
        apeBalance: userInfo.apeBalance,
        appessoBalance: userInfo.appessoBalance,
        cached: true,
        lastUpdated: userInfo.appessoBalanceUpdatedAt,
        customerInfo: {
          phoneNumber: userInfo.phoneNumber,
        },
      });
    }

    // Only call Pospal API if no cached balance exists
    // This should be rare as the appesso-balance endpoint will cache it
    try {
      const pospalClient = createPospalClient();
      const customer = await pospalClient.queryCustomerByPhone(userInfo.phoneNumber);

      if (!customer) {
        return NextResponse.json({
          eligible: false,
          reason: 'Appesso account not found',
          apeBalance: userInfo.apeBalance,
        });
      }

      const appessoBalance = customer.balance + (customer.extInfo?.subsidyAmount || 0);
      
      // Cache the balance for future use
      await prisma.user.update({
        where: { id: user.id },
        data: {
          appessoBalance,
          appessoBalanceUpdatedAt: new Date(),
        },
      });

      return NextResponse.json({
        eligible: true,
        apeBalance: userInfo.apeBalance,
        appessoBalance,
        cached: false,
        customerInfo: {
          name: customer.name,
          memberNumber: customer.number,
          phoneNumber: customer.phone,
        },
      });
    } catch (pospalError) {
      console.error('Pospal API error in transfer eligibility check:', pospalError);
      
      // Return error but don't block the UI
      return NextResponse.json({
        eligible: false,
        reason: 'Unable to verify Appesso account. Please try again later.',
        apeBalance: userInfo.apeBalance,
      });
    }

  } catch (error) {
    console.error('Error checking transfer eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check transfer eligibility' },
      { status: 500 }
    );
  }
}
