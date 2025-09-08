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

    setLoading((prev) => ({ ...prev, password: true }));

    try {
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        password,
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
        showToast({ 
          type: 'error', 
          title: '发送失败', 
          message: error.message || '请稍后重试' 
        });
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

          {/* SMS Verification for Register - DISABLED FOR TESTING PHASE */}
          {/* Uncomment this section when SMS verification is needed */}
          {/* {mode === 'register' && (
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
          )} */}

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

      {/* Divider with social login options */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            或使用其他方式
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onPress={() => signIn('github', { callbackUrl })}
          mode="subtle"
          expand="full"
          isDisabled={isLoading}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
        </Button>

        <Button
          onPress={() => signIn('google', { callbackUrl })}
          mode="subtle"
          expand="full"
          isDisabled={isLoading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </Button>

        <Button
          onPress={() => signIn('facebook', { callbackUrl })}
          mode="subtle"
          expand="full"
          isDisabled={isLoading}
        >
          <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}