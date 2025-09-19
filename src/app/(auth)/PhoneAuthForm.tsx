'use client';

import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/hooks/useToast';
import { Phone, Lock, MessageSquare, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

interface PhoneAuthFormProps {
  mode: 'login' | 'register';
}

export function PhoneAuthForm({ mode }: PhoneAuthFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'sms'>('password');
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    password: false,
    sms: false,
    sendCode: false,
  });
  const [smsCountdown, setSmsCountdown] = useState(0);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/feed';
  const { showToast } = useToast();

  // Start countdown timer
  const startCountdown = useCallback(() => {
    setSmsCountdown(60);
    const timer = setInterval(() => {
      setSmsCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

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

  // Handle password login/register
  const handlePasswordAuth = useCallback(async () => {
    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      setInputError(phoneError);
      return;
    }

    if (password.length < 6) {
      setInputError('密码至少需要6个字符');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setInputError('两次输入的密码不一致');
      return;
    }

    if (mode === 'register' && smsCode.length !== 6) {
      setInputError('请输入6位短信验证码');
      return;
    }

    setLoading((prev) => ({ ...prev, password: true }));

    try {
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        password,
        smsCode: mode === 'register' ? smsCode : undefined,
        mode,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        console.log('Auth error:', signInResult.error, 'Mode:', mode);
        if (mode === 'register') {
          showToast({ 
            type: 'error', 
            title: '注册失败', 
            message: '注册失败，请检查输入信息或稍后重试' 
          });
        } else {
          showToast({ 
            type: 'error', 
            title: '登录失败', 
            message: '手机号或密码错误' 
          });
        }
      } else if (signInResult?.ok) {
        showToast({
          type: 'success',
          title: mode === 'register' ? '注册成功' : '登录成功',
          message: '正在跳转...',
        });
        window.location.href = callbackUrl;
      }
    } catch (error) {
      showToast({ 
        type: 'error', 
        title: '操作失败', 
        message: '请稍后重试' 
      });
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  }, [phoneNumber, password, confirmPassword, mode, callbackUrl, showToast, validatePhone]);

  // Send SMS verification code
  const sendSmsCode = useCallback(async () => {
    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      setInputError(phoneError);
      return;
    }

    setLoading((prev) => ({ ...prev, sendCode: true }));

    try {
      const response = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          mode 
        }),
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: '验证码已发送',
          message: '请查看您的手机短信',
        });
        setShowSmsInput(true);
        startCountdown();
      } else {
        const error = await response.json();

        // Handle rate limiting (429) specifically
        if (response.status === 429) {
          showToast({
            type: 'warning',
            title: '发送过于频繁',
            message: error.error || '请稍后重试'
          });
          // Start countdown if not already running
          if (smsCountdown === 0) {
            startCountdown();
          }
        } else {
          showToast({
            type: 'error',
            title: '发送失败',
            message: error.error || '请稍后重试'
          });
        }
      }
    } catch (error) {
      showToast({ 
        type: 'error', 
        title: '发送失败', 
        message: '请检查网络连接' 
      });
    } finally {
      setLoading((prev) => ({ ...prev, sendCode: false }));
    }
  }, [phoneNumber, mode, showToast, validatePhone, startCountdown]);

  // Handle SMS verification
  const handleSmsAuth = useCallback(async () => {
    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      setInputError(phoneError);
      return;
    }

    if (smsCode.length !== 6) {
      setInputError('请输入6位验证码');
      return;
    }

    setLoading((prev) => ({ ...prev, sms: true }));

    try {
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        smsCode,
        mode,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        showToast({ 
          type: 'error', 
          title: '验证失败', 
          message: '验证码错误或已过期' 
        });
      } else if (signInResult?.ok) {
        showToast({
          type: 'success',
          title: mode === 'register' ? '注册成功' : '登录成功',
          message: '正在跳转...',
        });
        window.location.href = callbackUrl;
      }
    } catch (error) {
      showToast({ 
        type: 'error', 
        title: '操作失败', 
        message: '请稍后重试' 
      });
    } finally {
      setLoading((prev) => ({ ...prev, sms: false }));
    }
  }, [phoneNumber, smsCode, mode, callbackUrl, showToast, validatePhone]);

  const isLoading = loading.password || loading.sms || loading.sendCode;

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
          disabled={isLoading}
        />
      </div>

      {/* Auth Method Tabs - Only show for login */}
      {mode === 'login' && (
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setShowSmsInput(false);
              setInputError(null);
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              authMethod === 'password' 
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            disabled={isLoading}
          >
            密码登录
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('sms');
              setInputError(null);
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              authMethod === 'sms' 
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            disabled={isLoading}
          >
            短信验证
          </button>
        </div>
      )}

      {/* Password Input - Show for password login or register */}
      {(authMethod === 'password' || mode === 'register') && (
        <>
          <div>
            <TextInput
              value={password}
              onChange={(text) => {
                setPassword(text);
                setInputError(null);
              }}
              label={mode === 'register' ? '设置密码' : '密码'}
              placeholder="请输入密码"
              type="password"
              Icon={Lock}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password - Only for register */}
          {mode === 'register' && (
            <div>
              <TextInput
                value={confirmPassword}
                onChange={(text) => {
                  setConfirmPassword(text);
                  setInputError(null);
                }}
                label="确认密码"
                placeholder="请再次输入密码"
                type="password"
                Icon={Lock}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          )}

          {/* SMS Verification for Register */}
          {mode === 'register' && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <TextInput
                    value={smsCode}
                    onChange={(text) => {
                      setSmsCode(text.replace(/\D/g, '').slice(0, 6));
                      setInputError(null);
                    }}
                    label="短信验证码"
                    placeholder="请输入验证码"
                    Icon={MessageSquare}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onPress={sendSmsCode}
                    mode="subtle"
                    isDisabled={isLoading || smsCountdown > 0}
                    loading={loading.sendCode}
                  >
                    {smsCountdown > 0 ? `${smsCountdown}秒后重试` : '获取验证码'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Password Submit Button */}
          <Button
            onPress={handlePasswordAuth}
            expand="full"
            loading={loading.password}
            isDisabled={isLoading}
            Icon={ArrowRight}
          >
            {mode === 'register' ? '注册' : '登录'}
          </Button>
        </>
      )}

      {/* SMS Login - Only for login mode */}
      {mode === 'login' && authMethod === 'sms' && (
        <>
          {!showSmsInput ? (
            <Button
              onPress={sendSmsCode}
              expand="full"
              loading={loading.sendCode}
              isDisabled={isLoading || smsCountdown > 0}
              Icon={MessageSquare}
            >
              {smsCountdown > 0 ? `${smsCountdown}秒后重试` : '获取验证码'}
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <TextInput
                    value={smsCode}
                    onChange={(text) => {
                      setSmsCode(text.replace(/\D/g, '').slice(0, 6));
                      setInputError(null);
                    }}
                    label="验证码"
                    placeholder="请输入6位验证码"
                    Icon={MessageSquare}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onPress={sendSmsCode}
                    mode="subtle"
                    isDisabled={isLoading || smsCountdown > 0}
                    loading={loading.sendCode}
                  >
                    {smsCountdown > 0 ? `${smsCountdown}秒` : '重发'}
                  </Button>
                </div>
              </div>

              <Button
                onPress={handleSmsAuth}
                expand="full"
                loading={loading.sms}
                isDisabled={isLoading}
                Icon={ArrowRight}
              >
                验证并登录
              </Button>
            </>
          )}
        </>
      )}

    </div>
  );
}