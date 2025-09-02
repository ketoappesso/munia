import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import { createPospalClient } from '@/lib/pospal/client';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's phone number from database
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        phoneNumber: true,
        username: true,
      },
    });

    if (!userInfo?.phoneNumber) {
      return NextResponse.json({ 
        balance: 0,
        message: 'Phone number not found. Please update your profile.',
        store: null 
      });
    }

    // Get store preference from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const storeCode = searchParams.get('store') || 'ZD';

    try {
      // Create Pospal client for the specified store
      const pospalClient = createPospalClient(storeCode as any);
      
      // Fetch balance from Pospal
      const balance = await pospalClient.getCustomerBalance(userInfo.phoneNumber);
      
      return NextResponse.json({
        balance,
        store: pospalClient.getStoreName(),
        phoneNumber: userInfo.phoneNumber.substring(0, 3) + '****' + userInfo.phoneNumber.substring(7),
      });
    } catch (pospalError) {
      console.error('Pospal API error:', pospalError);
      
      // Return cached balance if Pospal API fails
      return NextResponse.json({
        balance: 0,
        message: 'Unable to fetch real-time balance. Using cached value.',
        store: null,
      });
    }
  } catch (error) {
    console.error('Error fetching Appesso balance:', error);
    return NextResponse.json({ error: 'Failed to fetch Appesso balance' }, { status: 500 });
  }
}
