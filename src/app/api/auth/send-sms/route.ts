import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { smsCodeStore } from '@/lib/auth/smsVerification';
import { getVerificationService } from '@/lib/sms/verificationService';

export async function POST(request: Request) {
  try {
    const { phoneNumber, mode } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: '请提供手机号码' },
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

    // Check if phone exists for login or doesn't exist for register
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (mode === 'login' && !existingUser) {
      return NextResponse.json(
        { error: '该手机号未注册' },
        { status: 404 }
      );
    }

    if (mode === 'register' && existingUser) {
      return NextResponse.json(
        { error: '该手机号已被注册' },
        { status: 409 }
      );
    }

    // Check rate limiting
    const existingCode = smsCodeStore.get(cleanPhone);
    if (existingCode && existingCode.attempts >= 3) {
      const remainingTime = Math.ceil((existingCode.expiry - Date.now()) / 1000);
      if (remainingTime > 0) {
        return NextResponse.json(
          { error: `请等待 ${remainingTime} 秒后重试` },
          { status: 429 }
        );
      }
    }

    // Try to send SMS using Tencent Cloud SMS service
    const verificationService = getVerificationService();
    const smsResult = await verificationService.sendVerificationCode(cleanPhone);

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.message },
        { status: 429 }
      );
    }

    // For development environment, also return the code for testing
    if (process.env.NODE_ENV === 'development') {
      // Get the verification info for dev mode
      const verificationInfo = verificationService.getVerificationInfo(cleanPhone);
      return NextResponse.json({
        success: true,
        message: smsResult.message,
        // Only for development - remove in production
        devCode: verificationInfo?.code,
        canResendAt: smsResult.canResendAt,
      });
    }

    return NextResponse.json({
      success: true,
      message: smsResult.message,
      canResendAt: smsResult.canResendAt,
    });
  } catch (error) {
    console.error('[SMS] Error sending code:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
}