import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createPospalClient } from '@/lib/pospal/client';
import prisma from '@/lib/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's phone number
    const userInfo = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phoneNumber: true,
        username: true,
        name: true,
      },
    });
    
    if (!userInfo?.phoneNumber) {
      return NextResponse.json({
        isValid: false,
        level: '非会员',
        expiryDate: null,
        balance: 0,
        points: 0,
        isApeLord: false,
        customerUid: null,
        name: null,
        message: 'Phone number not found',
      });
    }
    
    // Check if we should force refresh
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    try {
      // Use the same Pospal client that works for balance
      const pospalClient = createPospalClient();
      
      // Query customer information by phone
      const customer = await pospalClient.queryCustomerByPhone(userInfo.phoneNumber);
      
      if (!customer) {
        return NextResponse.json({
          isValid: false,
          level: '非会员',
          expiryDate: null,
          balance: 0,
          points: 0,
          isApeLord: false,
          customerUid: null,
          name: userInfo.name,
          message: 'Not a member',
        });
      }
      
      // Check if membership is valid
      const expiryDate = customer.expiryDate ? new Date(customer.expiryDate) : null;
      const isValid = customer.enable === 1 && (!expiryDate || expiryDate > new Date());
      
      // Check if it's Ape Lord member
      const isApeLord = customer.categoryName?.includes('猿佬') || 
                       customer.categoryName?.includes('钻石') ||
                       customer.categoryName?.includes('至尊') ||
                       false;
      
      // Calculate total balance including subsidy
      const mainBalance = customer.balance || 0;
      const subsidyBalance = customer.extInfo?.subsidyAmount || 0;
      const totalBalance = mainBalance + subsidyBalance;
      
      return NextResponse.json({
        isValid,
        level: customer.categoryName || '普通会员',
        expiryDate: customer.expiryDate || null,
        balance: totalBalance,
        points: customer.point || 0,
        isApeLord,
        customerUid: customer.customerUid,
        name: customer.name || userInfo.name,
        discount: customer.discount || 100,
        phone: customer.phone,
        // Additional member info
        birthday: customer.birthday,
        email: customer.email,
        address: customer.address,
        remarks: customer.remarks,
        faceImgUrl: customer.faceImgUrl,
        photoPath: customer.extInfo?.photoPath,
        nickName: customer.extInfo?.nickName,
        // Calculate days remaining if there's an expiry date
        daysRemaining: expiryDate 
          ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
        // Store info
        store: pospalClient.getStoreName(),
      });
    } catch (pospalError: any) {
      console.error('Pospal API error:', pospalError);
      
      // Check if it's a rate limit error
      if (pospalError.message?.includes('您已用完当日请求量')) {
        return NextResponse.json({
          isValid: false,
          level: '查询受限',
          message: 'API rate limit reached. Please try again tomorrow.',
          balance: 0,
          points: 0,
          isApeLord: false,
        });
      }
      
      return NextResponse.json({
        isValid: false,
        level: '查询失败',
        message: pospalError.message || 'Failed to query member information',
        balance: 0,
        points: 0,
        isApeLord: false,
      });
    }
  } catch (error) {
    console.error('Error in member info API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to query any phone number (for admin use)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { phoneNumber } = body;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    try {
      const pospalClient = createPospalClient();
      const customer = await pospalClient.queryCustomerByPhone(phoneNumber);
      
      if (!customer) {
        return NextResponse.json({
          isValid: false,
          level: '非会员',
          expiryDate: null,
          balance: 0,
          points: 0,
          isApeLord: false,
          customerUid: null,
          name: null,
          message: `No member found for phone: ${phoneNumber}`,
        });
      }
      
      const expiryDate = customer.expiryDate ? new Date(customer.expiryDate) : null;
      const isValid = customer.enable === 1 && (!expiryDate || expiryDate > new Date());
      const isApeLord = customer.categoryName?.includes('猿佬') || 
                       customer.categoryName?.includes('钻石') ||
                       customer.categoryName?.includes('至尊') ||
                       false;
      
      const mainBalance = customer.balance || 0;
      const subsidyBalance = customer.extInfo?.subsidyAmount || 0;
      const totalBalance = mainBalance + subsidyBalance;
      
      return NextResponse.json({
        isValid,
        level: customer.categoryName || '普通会员',
        expiryDate: customer.expiryDate || null,
        balance: totalBalance,
        points: customer.point || 0,
        isApeLord,
        customerUid: customer.customerUid,
        name: customer.name,
        discount: customer.discount || 100,
        phone: customer.phone,
        daysRemaining: expiryDate 
          ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
        store: pospalClient.getStoreName(),
      });
    } catch (pospalError: any) {
      console.error('Pospal API error:', pospalError);
      
      return NextResponse.json({
        isValid: false,
        level: '查询失败',
        message: pospalError.message || 'Failed to query member information',
        balance: 0,
        points: 0,
        isApeLord: false,
      });
    }
  } catch (error) {
    console.error('Error in member query POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}