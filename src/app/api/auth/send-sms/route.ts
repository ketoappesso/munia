import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { smsCodeStore } from '@/lib/auth/smsVerification';

export async function POST(request: NextRequest) {
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

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 5-minute expiry
    smsCodeStore.set(cleanPhone, {
      code,
      expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: (existingCode?.attempts || 0) + 1,
    });

    // In production, send actual SMS here
    // For development, log the code
    console.log(`[SMS] Verification code for ${cleanPhone}: ${code}`);

    // In development environment, also return the code for testing
    // Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: '验证码已发送',
        // Only for development - remove in production
        devCode: code,
      });
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
    });
  } catch (error) {
    console.error('[SMS] Error sending code:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
}