'use client';

import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/hooks/useToast';
import { Phone, Lock, MessageSquare, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export function UnifiedPhoneAuthForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/feed';
  const { showToast } = useToast();

  // Validate phone number
  const validatePhone = useCallback((phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return '请输入有效的手机号码';
    }
    return null;
  }, []);

  // Handle phone number change
  const onPhoneChange = useCallback((text: string) => {
    // Only allow digits, spaces, and common phone characters
    const filtered = text.replace(/[^\d\s\-\(\)\+]/g, '');
    setPhoneNumber(filtered);
    setInputError(null);
  }, []);

  // Handle unified authentication (auto login/register)
  const handleUnifiedAuth = useCallback(async () => {
    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      setInputError(phoneError);
      return;
    }

    if (password.length < 6) {
      setInputError('密码至少需要6个字符');
      return;
    }

    setLoading(true);

    try {
      // First try login - backend will auto-register if user doesn't exist
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        password,
        smsCode: smsCode || '123456', // Use placeholder for SMS bypass
        mode: 'auto', // New mode for auto login/register
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        console.log('Auth error:', signInResult.error);
        showToast({
          type: 'error',
          title: '认证失败',
          message: '请检查手机号和密码',
        });
      } else if (signInResult?.ok) {
        showToast({
          type: 'success',
          title: '登录成功',
          message: '正在跳转...',
        });
        window.location.href = callbackUrl;
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: '操作失败',
        message: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, password, smsCode, callbackUrl, showToast, validatePhone]);

  return (
    <div className="space-y-4">
      {/* Phone Number Input */}
      <div>
        <TextInput
          value={phoneNumber}
          onChange={onPhoneChange}
          label="手机号码"
          placeholder="请输入手机号"
          errorMessage={inputError || undefined}
          Icon={Phone}
          autoComplete="tel"
          disabled={loading}
        />
      </div>

      {/* Password Input */}
      <div>
        <TextInput
          value={password}
          onChange={(text) => {
            setPassword(text);
            setInputError(null);
          }}
          label="密码"
          placeholder="请输入密码（新用户将自动注册）"
          type="password"
          Icon={Lock}
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      {/* SMS Code Input - Disabled with notice */}
      <div>
        <TextInput
          value={smsCode}
          onChange={(text) => {
            setSmsCode(text.replace(/\D/g, '').slice(0, 6));
            setInputError(null);
          }}
          label="短信验证码（输入任意）"
          placeholder="输入任意数字（暂时关闭）"
          Icon={MessageSquare}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          由于服务商原因，短信验证功能暂时关闭，输入任意数字即可
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onPress={handleUnifiedAuth}
        expand="full"
        loading={loading}
        isDisabled={loading}
        Icon={ArrowRight}
      >
        登录/注册
      </Button>
    </div>
  );
}