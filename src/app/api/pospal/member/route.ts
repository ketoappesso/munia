import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';

// Pospal API configuration
const POSPAL_CONFIG = {
  apiUrl: 'https://area20-win.pospal.cn:443',
  appId: '425063AC22F21CCD8E293004DDD8DA95',
  appKey: '292141986252122977'
};

// Helper function to generate Pospal signature
function generatePospalSignature(appKey: string, timestamp: number | string, appId: string): string {
  const signContent = appKey + timestamp + appId;
  return crypto.createHash('md5').update(signContent).digest('hex').toUpperCase();
}

// Helper function to query Pospal API
async function queryPospalMember(phoneNumber: string) {
  const timestamp = Date.now();
  const signature = generatePospalSignature(POSPAL_CONFIG.appKey, timestamp, POSPAL_CONFIG.appId);
  
  const url = `${POSPAL_CONFIG.apiUrl}/pospal-api2/openapi/v1/customerOpenapi/queryBytel`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'openApi',
        'Content-Type': 'application/json; charset=utf-8',
        'accept-encoding': 'gzip,deflate',
        'time-stamp': timestamp.toString(),
        'data-signature': signature
      },
      body: JSON.stringify({
        appId: POSPAL_CONFIG.appId,
        customerTel: phoneNumber
      })
    });
    
    const result = await response.json();
    console.log('Pospal API Response:', result);
    
    if (result.status === 'success' && result.data && result.data.length > 0) {
      return result.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error calling Pospal API:', error);
    return null;
  }
}

export async function POST(request: Request) {
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
    
    // Query real Pospal API
    const member = await queryPospalMember(phoneNumber);
    
    if (!member) {
      return NextResponse.json({
        isValid: false,
        level: '非会员',
        expiryDate: null,
        balance: 0,
        points: 0,
        isApeLord: false,
        customerUid: null,
        name: null,
      });
    }
    
    // Check if membership is valid
    const expiryDate = member.expiryDate ? new Date(member.expiryDate) : null;
    const isValid = member.enable === 1 && (!expiryDate || expiryDate > new Date());
    
    // Check if it's Ape Lord member
    const isApeLord = member.categoryName?.includes('猿佬') || false;
    
    return NextResponse.json({
      isValid,
      level: member.categoryName || '普通会员',
      expiryDate: member.expiryDate || null,
      balance: member.balance || 0,
      points: member.point || 0,
      isApeLord,
      customerUid: member.customerUid,
      name: member.name,
      discount: member.discount,
      // Additional info for display
      daysRemaining: expiryDate 
        ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
    });
  } catch (error) {
    console.error('Error in member query API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get current user's phone number from session
    const phoneNumber = session.user.phoneNumber;
    
    if (!phoneNumber) {
      return NextResponse.json({
        isValid: false,
        level: '非会员',
        expiryDate: null,
        balance: 0,
        points: 0,
        isApeLord: false,
        customerUid: null,
        name: null,
      });
    }
    
    // Query real Pospal API
    const member = await queryPospalMember(phoneNumber);
    
    if (!member) {
      return NextResponse.json({
        isValid: false,
        level: '非会员',
        expiryDate: null,
        balance: 0,
        points: 0,
        isApeLord: false,
        customerUid: null,
        name: null,
      });
    }
    
    const expiryDate = member.expiryDate ? new Date(member.expiryDate) : null;
    const isValid = member.enable === 1 && (!expiryDate || expiryDate > new Date());
    const isApeLord = member.categoryName?.includes('猿佬') || false;
    
    return NextResponse.json({
      isValid,
      level: member.categoryName || '普通会员',
      expiryDate: member.expiryDate || null,
      balance: member.balance || 0,
      points: member.point || 0,
      isApeLord,
      customerUid: member.customerUid,
      name: member.name,
      discount: member.discount,
      daysRemaining: expiryDate 
        ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
    });
  } catch (error) {
    console.error('Error in member query GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}