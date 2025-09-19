import { getServerUser } from '@/lib/getServerUser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [user] = await getServerUser();

    return NextResponse.json({
      hasUser: !!user,
      userId: user?.id,
      userName: user?.name,
      userPhone: user?.phoneNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get server user',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}