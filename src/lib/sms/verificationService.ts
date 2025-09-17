import { TencentSmsClient } from './tencentSms-official';

/**
 * SMS Verification Service
 *
 * This service handles SMS verification code sending and validation using Tencent Cloud SMS.
 *
 * Required environment variables:
 * - TENCENT_SMS_SECRET_ID: Tencent Cloud API Secret ID
 * - TENCENT_SMS_SECRET_KEY: Tencent Cloud API Secret Key
 * - TENCENT_SMS_SDK_APP_ID: SMS SDK Application ID
 * - TENCENT_SMS_SIGN_NAME: SMS signature name (approved by Tencent)
 * - TENCENT_SMS_TEMPLATE_ID: SMS template ID (approved by Tencent)
 * - TENCENT_SMS_REGION: Tencent Cloud region (default: ap-guangzhou)
 */

interface VerificationCode {
  code: string;
  phoneNumber: string;
  createdAt: number;
  attempts: number;
  verified: boolean;
}

class VerificationService {
  private smsClient: TencentSmsClient;
  private codes = new Map<string, VerificationCode>();
  private readonly CODE_EXPIRY_TIME = 5 * 60 * 1000; // 5分钟
  private readonly MAX_ATTEMPTS = 3;
  private readonly RESEND_COOLDOWN = 60 * 1000; // 1分钟重发间隔
  private readonly CODE_LENGTH = 6;

  constructor() {
    this.smsClient = new TencentSmsClient({
      secretId: process.env.TENCENT_SMS_SECRET_ID!,
      secretKey: process.env.TENCENT_SMS_SECRET_KEY!,
      smsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID!,
      signName: process.env.TENCENT_SMS_SIGN_NAME!,
      templateId: process.env.TENCENT_SMS_TEMPLATE_ID!,
      region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
    });
  }

  // 生成6位数字验证码
  private generateCode(): string {
    return Math.floor(Math.random() * Math.pow(10, this.CODE_LENGTH))
      .toString()
      .padStart(this.CODE_LENGTH, '0');
  }

  // 清理过期验证码
  private cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [key, verification] of this.codes.entries()) {
      if (now - verification.createdAt > this.CODE_EXPIRY_TIME) {
        this.codes.delete(key);
      }
    }
  }

  // 格式化手机号
  private formatPhoneNumber(phoneNumber: string): string {
    // 移除所有非数字字符
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // 如果是11位数字，假设是中国手机号
    if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      return cleanPhone;
    }

    // 如果已经包含国家码
    if (cleanPhone.length > 11) {
      return cleanPhone.slice(-11); // 取最后11位
    }

    return cleanPhone;
  }

  // 发送验证码
  async sendVerificationCode(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    canResendAt?: number;
  }> {
    try {
      this.cleanupExpiredCodes();

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const existing = this.codes.get(formattedPhone);
      const now = Date.now();

      // 检查重发间隔
      if (existing && (now - existing.createdAt) < this.RESEND_COOLDOWN) {
        const canResendAt = existing.createdAt + this.RESEND_COOLDOWN;
        const remainingSeconds = Math.ceil((canResendAt - now) / 1000);
        return {
          success: false,
          message: `请等待 ${remainingSeconds} 秒后再重新发送`,
          canResendAt,
        };
      }

      const code = this.generateCode();

      // 发送短信
      const sent = await this.smsClient.sendVerificationCode(formattedPhone, code);

      if (!sent) {
        return {
          success: false,
          message: '短信发送失败，请稍后重试',
        };
      }

      // 存储验证码
      this.codes.set(formattedPhone, {
        code,
        phoneNumber: formattedPhone,
        createdAt: now,
        attempts: 0,
        verified: false,
      });

      return {
        success: true,
        message: '验证码已发送，请查收短信',
        canResendAt: now + this.RESEND_COOLDOWN,
      };
    } catch (error) {
      console.error('Send verification code error:', error);
      return {
        success: false,
        message: '发送失败，请检查手机号码或稍后重试',
      };
    }
  }

  // 验证验证码
  verifyCode(phoneNumber: string, code: string): {
    success: boolean;
    message: string;
  } {
    this.cleanupExpiredCodes();

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const verification = this.codes.get(formattedPhone);

    if (!verification) {
      return {
        success: false,
        message: '验证码不存在或已过期，请重新获取',
      };
    }

    const now = Date.now();

    // 检查是否过期
    if (now - verification.createdAt > this.CODE_EXPIRY_TIME) {
      this.codes.delete(formattedPhone);
      return {
        success: false,
        message: '验证码已过期，请重新获取',
      };
    }

    // 检查尝试次数
    if (verification.attempts >= this.MAX_ATTEMPTS) {
      this.codes.delete(formattedPhone);
      return {
        success: false,
        message: '验证次数过多，请重新获取验证码',
      };
    }

    // 增加尝试次数
    verification.attempts++;

    // 验证码码
    if (verification.code !== code) {
      return {
        success: false,
        message: `验证码错误，还可尝试 ${this.MAX_ATTEMPTS - verification.attempts} 次`,
      };
    }

    // 验证成功，标记为已验证
    verification.verified = true;

    return {
      success: true,
      message: '验证成功',
    };
  }

  // 检查手机号是否已验证
  isPhoneVerified(phoneNumber: string): boolean {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const verification = this.codes.get(formattedPhone);

    if (!verification) return false;

    const now = Date.now();
    const isNotExpired = (now - verification.createdAt) <= this.CODE_EXPIRY_TIME;

    return verification.verified && isNotExpired;
  }

  // 清除验证码记录（登录/注册成功后调用）
  clearVerification(phoneNumber: string): void {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    this.codes.delete(formattedPhone);
  }

  // 获取验证码统计信息（调试用）
  getVerificationInfo(phoneNumber: string): VerificationCode | null {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    return this.codes.get(formattedPhone) || null;
  }
}

// 单例模式
let verificationService: VerificationService | null = null;

export function getVerificationService(): VerificationService {
  if (!verificationService) {
    verificationService = new VerificationService();
  }
  return verificationService;
}

export { VerificationService, type VerificationCode };