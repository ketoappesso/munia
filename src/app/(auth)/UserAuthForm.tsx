'use client';

import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/hooks/useToast';
import { AtSign, Facebook, Github, Google, LogInSquare, Phone } from '@/svg_components';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { z } from 'zod';

const emailSchema = z.string().trim().email();
const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Phone number must be at least 10 characters')
  .max(15, 'Phone number too long')
  .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format');

export function UserAuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    email: false,
    phone: false,
    sms: false,
    github: false,
    facebook: false,
    google: false,
  });

  const areButtonsDisabled =
    loading.email || loading.phone || loading.sms || loading.github || loading.facebook || loading.google;
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/feed';
  const { showToast } = useToast();

  const onEmailChange = useCallback((text: string) => {
    setEmail(text);
    setInputError(null);
  }, []);

  const onPhoneChange = useCallback((text: string) => {
    setPhoneNumber(text);
    setInputError(null);
  }, []);

  const onPasswordChange = useCallback((text: string) => {
    setPassword(text);
    setInputError(null);
  }, []);

  const onSmsCodeChange = useCallback((text: string) => {
    setSmsCode(text);
    setInputError(null);
  }, []);

  const submitEmail = useCallback(async () => {
    setLoading((prev) => ({
      ...prev,
      email: true,
    }));

    const validateEmail = emailSchema.safeParse(email);
    if (validateEmail.success) {
      const signInResult = await signIn('email', {
        email: email.toLowerCase(),
        redirect: false,
        callbackUrl,
      });

      setLoading((prev) => ({
        ...prev,
        email: false,
      }));
      if (!signInResult?.ok) {
        showToast({ type: 'error', title: 'Something went wrong' });
        return;
      }
      showToast({
        type: 'success',
        title: 'Email Sent',
        message: 'Please check your email to sign in.',
      });
    } else {
      setInputError(validateEmail.error.issues[0].message);
      setLoading((prev) => ({
        ...prev,
        email: false,
      }));
    }
  }, [email, callbackUrl, showToast]);

  const submitPhonePassword = useCallback(async () => {
    setLoading((prev) => ({
      ...prev,
      phone: true,
    }));

    const validatePhone = phoneSchema.safeParse(phoneNumber);
    if (validatePhone.success && password.length >= 6) {
      // Implement phone + password authentication
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      setLoading((prev) => ({
        ...prev,
        phone: false,
      }));

      if (signInResult?.error) {
        if (mode === 'register') {
          showToast({ type: 'error', title: 'Registration failed', message: 'Phone number may already be registered' });
        } else {
          showToast({ type: 'error', title: 'Invalid phone number or password' });
        }
      } else if (signInResult?.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          message: mode === 'register' ? 'Account created successfully' : 'Logged in successfully',
        });
        // Redirect to feed page after successful registration/login
        window.location.href = callbackUrl;
      }
    } else {
      if (!validatePhone.success) {
        setInputError(validatePhone.error.issues[0].message);
      } else if (password.length < 6) {
        setInputError('Password must be at least 6 characters');
      }
      setLoading((prev) => ({
        ...prev,
        phone: false,
      }));
    }
  }, [phoneNumber, password, callbackUrl, showToast]);

  const requestSmsCode = useCallback(async () => {
    setLoading((prev) => ({
      ...prev,
      sms: true,
    }));

    const validatePhone = phoneSchema.safeParse(phoneNumber);
    if (validatePhone.success) {
      // Implement SMS code request
      showToast({
        type: 'success',
        title: 'SMS Sent',
        message: 'Verification code sent to your phone',
      });
      setLoading((prev) => ({
        ...prev,
        sms: false,
      }));
    } else {
      setInputError(validatePhone.error.issues[0].message);
      setLoading((prev) => ({
        ...prev,
        sms: false,
      }));
    }
  }, [phoneNumber, showToast]);

  const submitSmsCode = useCallback(async () => {
    setLoading((prev) => ({
      ...prev,
      sms: true,
    }));

    if (smsCode.length === 6) {
      // Implement SMS code verification
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber.trim(),
        smsCode,
        redirect: false,
        callbackUrl,
      });

      setLoading((prev) => ({
        ...prev,
        sms: false,
      }));

      if (signInResult?.error) {
        showToast({ type: 'error', title: 'Invalid verification code' });
      } else if (signInResult?.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Logged in successfully',
        });
        // Redirect to feed page after successful login
        window.location.href = callbackUrl;
      }
    } else {
      setInputError('Verification code must be 6 digits');
      setLoading((prev) => ({
        ...prev,
        sms: false,
      }));
    }
  }, [phoneNumber, smsCode, callbackUrl, showToast]);

  const signInWithProvider = useCallback(
    (provider: 'github' | 'google' | 'facebook') => async () => {
      setLoading((prev) => ({
        ...prev,
        [provider]: true,
      }));
      const signInResult = await signIn(provider, {
        callbackUrl,
      });
      setLoading((prev) => ({
        ...prev,
        [provider]: false,
      }));
      if (signInResult?.error) {
        showToast({ type: 'error', title: 'Something went wrong' });
      }
    },
    [callbackUrl, showToast],
  );

  const handleEmailMethod = useCallback(() => setAuthMethod('email'), [setAuthMethod]);
  const handlePhoneMethod = useCallback(() => setAuthMethod('phone'), [setAuthMethod]);

  return (
    <>
      <div className="mb-4 flex gap-2">
        <Button
          onPress={handleEmailMethod}
          shape="pill"
          mode={authMethod === 'email' ? 'primary' : 'subtle'}
          expand="full"
          isDisabled={areButtonsDisabled}>
          Email
        </Button>
        <Button
          onPress={handlePhoneMethod}
          shape="pill"
          mode={authMethod === 'phone' ? 'primary' : 'subtle'}
          expand="full"
          isDisabled={areButtonsDisabled}>
          Phone
        </Button>
      </div>

      {authMethod === 'email' ? (
        <>
          <div className="mb-4">
            <TextInput
              value={email}
              onChange={onEmailChange}
              label="Email"
              errorMessage={inputError || undefined}
              Icon={AtSign}
            />
          </div>
          <div className="mb-5">
            <Button
              onPress={submitEmail}
              shape="pill"
              expand="full"
              Icon={LogInSquare}
              loading={loading.email}
              isDisabled={areButtonsDisabled}>
              {mode === 'login' ? 'Login' : 'Sign up'} with Email
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <TextInput
              value={phoneNumber}
              onChange={onPhoneChange}
              label="Phone Number"
              placeholder="+1234567890"
              errorMessage={inputError || undefined}
              Icon={Phone}
            />
          </div>

          {mode === 'register' ? (
            <>
              <div className="mb-4">
                <TextInput
                  value={password}
                  onChange={onPasswordChange}
                  label="Password"
                  type="password"
                  errorMessage={inputError || undefined}
                />
              </div>
              <div className="mb-5">
                <Button
                  onPress={submitPhonePassword}
                  shape="pill"
                  expand="full"
                  Icon={LogInSquare}
                  loading={loading.phone}
                  isDisabled={areButtonsDisabled}>
                  Sign up with Phone
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <TextInput
                  value={password}
                  onChange={onPasswordChange}
                  label="Password"
                  type="password"
                  errorMessage={inputError || undefined}
                />
              </div>
              <div className="mb-3">
                <Button
                  onPress={submitPhonePassword}
                  shape="pill"
                  expand="full"
                  Icon={LogInSquare}
                  loading={loading.phone}
                  isDisabled={areButtonsDisabled}>
                  Login with Password
                </Button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center px-1">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-muted-foreground">OR</span>
                </div>
              </div>

              <div className="mb-4">
                <TextInput
                  value={smsCode}
                  onChange={onSmsCodeChange}
                  label="SMS Verification Code"
                  placeholder="123456"
                  errorMessage={inputError || undefined}
                />
              </div>
              <div className="mb-5 flex gap-2">
                <Button
                  onPress={requestSmsCode}
                  shape="pill"
                  expand="full"
                  mode="subtle"
                  loading={loading.sms}
                  isDisabled={areButtonsDisabled}>
                  Send Code
                </Button>
                <Button
                  onPress={submitSmsCode}
                  shape="pill"
                  expand="full"
                  Icon={LogInSquare}
                  loading={loading.sms}
                  isDisabled={areButtonsDisabled}>
                  Verify Code
                </Button>
              </div>
            </>
          )}
        </>
      )}

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center px-1">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-muted-foreground">OR CONTINUE WITH</span>
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-3">
        <Button
          onPress={signInWithProvider('github')}
          shape="pill"
          expand="full"
          mode="subtle"
          Icon={Github}
          loading={loading.github}
          isDisabled={areButtonsDisabled}>
          Github
        </Button>
        <div className="flex gap-2">
          <Button
            onPress={signInWithProvider('google')}
            shape="pill"
            expand="full"
            mode="subtle"
            Icon={Google}
            loading={loading.google}
            isDisabled={areButtonsDisabled}>
            Google
          </Button>
          <Button
            onPress={signInWithProvider('facebook')}
            shape="pill"
            expand="full"
            mode="subtle"
            Icon={Facebook}
            loading={loading.facebook}
            isDisabled={areButtonsDisabled}>
            Facebook
          </Button>
        </div>
      </div>
    </>
  );
}
