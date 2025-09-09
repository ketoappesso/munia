import Link from 'next/link';
import { PhoneAuthForm } from '../PhoneAuthForm';

export const metadata = {
  title: 'Appesso | 注册',
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">创建账户</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            加入 Appesso 社区
          </p>
        </div>

        {/* Phone Auth Form */}
        <PhoneAuthForm mode="register" />

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            已有账户？
            <Link 
              href="/login" 
              className="ml-1 font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}