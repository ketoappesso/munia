import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import { createPospalClient } from '@/lib/pospal/client';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: Request) {
  try {
    const [user] = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's information including cached balance
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        phoneNumber: true,
        username: true,
        appessoBalance: true,
        appessoBalanceUpdatedAt: true,
      },
    });

    if (!userInfo?.phoneNumber) {
      return NextResponse.json({
        balance: 0,
        message: 'Phone number not found. Please update your profile.',
        store: null,
        cached: false,
      });
    }

    // Check if we should force refresh (manual refresh from UI)
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Check if cached balance is still fresh (less than 1 hour old)
    const cacheAge = userInfo.appessoBalanceUpdatedAt 
      ? Date.now() - new Date(userInfo.appessoBalanceUpdatedAt).getTime()
      : Infinity;
    const cacheIsStale = cacheAge > 60 * 60 * 1000; // 1 hour in milliseconds

    // Use cached balance if available and fresh, unless force refresh
    if (!forceRefresh && userInfo.appessoBalance !== null && !cacheIsStale) {
      console.log('Returning cached Appesso balance:', userInfo.appessoBalance);
      return NextResponse.json({
        balance: userInfo.appessoBalance,
        store: '总店',
        phoneNumber: userInfo.phoneNumber.substring(0, 3) + '****' + userInfo.phoneNumber.substring(7),
        cached: true,
        lastUpdated: userInfo.appessoBalanceUpdatedAt,
      });
    }

    // Only call Pospal API if cache is stale or force refresh
    try {
      console.log('Fetching fresh balance from Pospal API...');
      const pospalClient = createPospalClient();
      
      // Fetch balance from Pospal
      const balance = await pospalClient.getCustomerBalance(userInfo.phoneNumber);
      
      // Update cached balance in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          appessoBalance: balance,
          appessoBalanceUpdatedAt: new Date(),
        },
      });
      
      console.log('Updated cached Appesso balance:', balance);
      
      return NextResponse.json({
        balance,
        store: pospalClient.getStoreName(),
        phoneNumber: userInfo.phoneNumber.substring(0, 3) + '****' + userInfo.phoneNumber.substring(7),
        cached: false,
        lastUpdated: new Date(),
      });
    } catch (pospalError) {
      console.error('Pospal API error:', pospalError);
      
      // Return cached balance if available when Pospal API fails
      if (userInfo.appessoBalance !== null) {
        return NextResponse.json({
          balance: userInfo.appessoBalance,
          message: 'Unable to fetch real-time balance. Using cached value.',
          store: '总店',
          cached: true,
          lastUpdated: userInfo.appessoBalanceUpdatedAt,
        });
      }
      
      return NextResponse.json({
        balance: 0,
        message: 'Unable to fetch balance. Please try again later.',
        store: null,
        cached: false,
      });
    }
  } catch (error) {
    console.error('Error fetching Appesso balance:', error);
    return NextResponse.json({ error: 'Failed to fetch Appesso balance' }, { status: 500 });
  }
}
