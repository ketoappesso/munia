'use client';

import { useRouter } from 'next/navigation';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { 
  ChevronLeft, 
  Crown, 
  CheckCircle, 
  Camera,
  Shield,
  Zap,
  Gift,
  Star,
  Coffee,
  Phone,
  MessageCircle
} from 'lucide-react';

export default function MembershipUpgradePage() {
  const router = useRouter();

  const benefits = [
    {
      icon: Camera,
      title: '人脸识别门禁',
      description: '刷脸快速通行，无需钥匙或卡片'
    },
    {
      icon: Shield,
      title: '专属折扣',
      description: '享受69.99%专属折扣优惠'
    },
    {
      icon: Zap,
      title: '积分翻倍',
      description: '每次消费获得双倍积分奖励'
    },
    {
      icon: Gift,
      title: '生日特权',
      description: '生日月专属优惠和礼品'
    },
    {
      icon: Star,
      title: '优先服务',
      description: '专属客服通道，优先处理'
    },
    {
      icon: Coffee,
      title: '免费升杯',
      description: '每月3次免费升级大杯'
    }
  ];

  return (
    <ResponsiveContainer className="mx-auto mb-4 px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-2 my-4">
        <ButtonNaked
          onPress={() => router.back()}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          aria-label="返回">
          <ChevronLeft className="h-6 w-6" />
        </ButtonNaked>
        <h1 className="text-3xl font-bold">
          升级猿佬会员
        </h1>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-8 mb-6">
        <div className="absolute top-0 right-0 text-[150px] opacity-10">
          🐵
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">猿佬会员</h2>
              <p className="text-white/80">尊享专属特权服务</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-white/80 text-sm">专属折扣</p>
              <p className="text-2xl font-bold text-white">69.99%</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-white/80 text-sm">积分倍数</p>
              <p className="text-2xl font-bold text-white">2X</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">会员专属权益</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">选择您的会员计划</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-2">月度会员</h4>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">¥99</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">每月</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">最受欢迎</span>
            </div>
            <h4 className="font-semibold mb-2">年度会员</h4>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">¥999</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">每年（省¥189）</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-2">终身会员</h4>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">¥2999</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">一次付费</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">如何升级</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          请前往任意猿素Appesso门店办理升级，或联系我们的客服团队。
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="tel:18874748888"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            <Phone className="h-5 w-5" />
            <span>致电客服</span>
          </a>
          <a 
            href="https://wa.me/8618874748888"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span>WhatsApp咨询</span>
          </a>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => window.location.href = 'tel:18874748888'}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-indigo-600 transition-colors flex items-center justify-center gap-2">
        <Crown className="h-6 w-6" />
        立即联系我们升级
      </button>
    </ResponsiveContainer>
  );
}