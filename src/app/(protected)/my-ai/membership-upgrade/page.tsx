'use client';

import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft, Crown, Check, Zap, Star, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function MembershipUpgradePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'lite' | 'pro'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'lite',
      name: 'Lite 会员',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      badge: <Star className="h-5 w-5 text-blue-500" />,
      color: 'from-blue-500 to-cyan-500',
      features: [
        'GPT-4 Turbo 无限使用',
        'Qwen & Kimi 优先队列',
        '每月 1000 次高级模型调用',
        '快速响应速度',
        '基础数据导出功能',
        '邮件客服支持',
      ],
      limitations: [
        'GPT-5 不可用',
        '无自定义模型训练',
        '无 API 访问权限',
      ],
    },
    {
      id: 'pro',
      name: 'Pro 会员',
      monthlyPrice: 59.99,
      yearlyPrice: 599.99,
      badge: <Crown className="h-5 w-5 text-yellow-500" />,
      color: 'from-yellow-500 to-orange-500',
      recommended: true,
      features: [
        'GPT-5 无限使用',
        'GPT-4 Turbo 无限使用',
        '所有模型优先队列',
        '无限高级模型调用',
        '超快响应速度',
        '高级数据导出功能',
        '自定义模型训练',
        'API 访问权限',
        '7×24 专属客服',
        '早期功能体验',
      ],
      limitations: [],
    },
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan);
  const displayPrice = billingCycle === 'monthly' 
    ? currentPlan?.monthlyPrice 
    : currentPlan?.yearlyPrice;
  const savings = billingCycle === 'yearly' && currentPlan
    ? (currentPlan.monthlyPrice * 12 - currentPlan.yearlyPrice).toFixed(2)
    : 0;

  const handleSubscribe = () => {
    console.log('Subscribing to:', selectedPlan, billingCycle);
    // TODO: Implement payment flow
  };

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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          升级会员
        </h1>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-8 py-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white">
        <h2 className="text-4xl font-bold mb-3">解锁 AI 的无限潜能</h2>
        <p className="text-xl opacity-90">选择适合您的会员计划，体验最先进的 AI 技术</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
            月付
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
            年付
            {savings > 0 && (
              <span className="ml-2 text-green-600 text-sm font-semibold">
                省 ¥{savings}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <div
              key={plan.id}
              className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 shadow-xl transform scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
              onClick={() => setSelectedPlan(plan.id as 'lite' | 'pro')}>
              
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  最受欢迎
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 mb-2 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                  {plan.badge}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  ¥{price}
                  <span className="text-lg text-gray-500 font-normal">
                    /{billingCycle === 'monthly' ? '月' : '年'}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start gap-2 opacity-60">
                    <span className="h-5 w-5 flex-shrink-0 mt-0.5 text-gray-400">✕</span>
                    <span className="text-gray-500 dark:text-gray-400 line-through">
                      {limitation}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selection Indicator */}
              <div className="flex justify-center">
                <div className={`w-6 h-6 rounded-full border-2 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isSelected && (
                    <Check className="h-4 w-4 text-white m-auto" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Rocket className="h-6 w-6 text-purple-600" />
          会员专属权益
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">极速响应</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              专属服务器，毫秒级响应
            </p>
          </div>
          <div className="text-center">
            <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">优先体验</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              抢先体验最新功能
            </p>
          </div>
          <div className="text-center">
            <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">尊贵标识</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              专属会员徽章展示
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-4">
        <Button
          onPress={handleSubscribe}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          立即订阅 {currentPlan?.name}
        </Button>
        <p className="text-sm text-gray-500">
          7 天无理由退款 · 随时取消订阅 · 安全支付保障
        </p>
      </div>
    </ResponsiveContainer>
  );
}