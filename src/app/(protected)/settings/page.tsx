'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, User, Bell, Shield, Globe, Smartphone, HelpCircle, LogOut, Palette } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, handleThemeChange } = useContext(ThemeContext);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const getThemeLabel = () => {
    if (theme === 'light') return '白天';
    if (theme === 'dark') return '黑夜';
    return '跟随设备';
  };

  const switchTheme = () => {
    if (theme === 'system') handleThemeChange('light');
    else if (theme === 'light') handleThemeChange('dark');
    else handleThemeChange('system');
  };

  const settingsItems = [
    {
      icon: User,
      title: '账号管理',
      description: '修改个人信息和密码',
      onClick: () => router.push('/edit-profile'),
    },
    {
      icon: Bell,
      title: '通知设置',
      description: '管理通知偏好',
      onClick: () => router.push('/notifications'),
    },
    {
      icon: Shield,
      title: '隐私设置',
      description: '管理隐私和安全选项',
      onClick: () => router.push('/privacy-policy'),
    },
    {
      icon: Palette,
      title: '主题设置',
      description: getThemeLabel(),
      onClick: switchTheme,
    },
    {
      icon: Globe,
      title: '语言设置',
      description: '选择界面语言',
      onClick: () => {
        // TODO: Implement language settings
      },
    },
    {
      icon: Smartphone,
      title: '应用版本',
      description: 'v1.0.0',
      onClick: () => {},
      disabled: true,
    },
    {
      icon: HelpCircle,
      title: '帮助与反馈',
      description: '获取帮助或提供反馈',
      onClick: () => {
        // TODO: Implement help page
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">设置</h1>
        </div>
      </div>

      {/* User Info Section */}
      {session?.user && (
        <div className="px-4 py-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {session.user.profilePhoto ? (
                <img
                  src={session.user.profilePhoto}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{session.user.name || session.user.username}</h2>
              <p className="text-sm text-muted-foreground">
                {session.user.phoneNumber || session.user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="px-4 py-4">
        <div className="space-y-2">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-muted cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {!item.disabled && (
                  <svg
                    className="w-5 h-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-4 py-4 mt-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">
            {isLoggingOut ? '退出中...' : '退出登录'}
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 Appesso. All rights reserved.</p>
      </div>
    </div>
  );
}