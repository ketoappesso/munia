import Link from 'next/link';
import { PhoneAuthForm } from '../PhoneAuthForm';

export const metadata = {
  title: 'Munia | 登录',
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">欢迎回来</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            登录您的 Munia 账户
          </p>
        </div>

        {/* Phone Auth Form */}
        <PhoneAuthForm mode="login" />

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            还没有账户？
            <Link 
              href="/register" 
              className="ml-1 font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}