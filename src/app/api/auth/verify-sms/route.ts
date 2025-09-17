import { NextResponse } from 'next/server';
import { getVerificationService } from '@/lib/sms/verificationService';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: '请提供手机号码和验证码' },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json(
        { error: '无效的手机号码' },
        { status: 400 }
      );
    }

    // Verify the code
    const verificationService = getVerificationService();
    const result = verificationService.verifyCode(cleanPhone, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('[SMS] Error verifying code:', error);
    return NextResponse.json(
      { error: '验证码验证失败' },
      { status: 500 }
    );
  }
}