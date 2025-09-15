import { Coffee, Gift, Clock, Percent, Truck, Building } from 'lucide-react';
import Link from 'next/link';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { ChevronLeft } from '@/svg_components';

export default function MemberBenefitsPage() {
  const benefits = [
    {
      icon: <Percent className="h-8 w-8 text-purple-600" />,
      title: '消费折扣优惠',
      description: '猿佬会员在猿素咖啡消费综合五折',
      highlight: '带猿素定制杯再减5块',
    },
    {
      icon: <Truck className="h-8 w-8 text-blue-600" />,
      title: '配送费减免',
      description: '两杯以上免配送费',
      highlight: '畅享免费配送',
    },
    {
      icon: <Clock className="h-8 w-8 text-green-600" />,
      title: '24小时空间使用权',
      description: '能不限时进出，随心使用店内24小时开放的自习和办公区域',
      highlight: '全天候开放',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/my-space">
            <ButtonNaked className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <ChevronLeft className="h-5 w-5" />
              <span>返回我的空间</span>
            </ButtonNaked>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 mb-4">
            <Coffee className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            猿素咖啡会员
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            尊享专属权益，品味精致生活
          </p>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 text-white mb-12 shadow-2xl">
          <div className="text-center">
            <p className="text-lg mb-2 opacity-90">年费会员</p>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-5xl font-bold">¥365.99</span>
              <span className="text-xl opacity-80">/年</span>
            </div>
            <p className="text-sm opacity-90">每天仅需一元，尊享全年特权</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            会员专属福利
          </h2>
          <div className="grid gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {benefit.description}
                    </p>
                    {benefit.highlight && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900 dark:to-blue-900 dark:text-purple-200">
                        <Gift className="h-4 w-4 mr-1" />
                        {benefit.highlight}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Features */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 mb-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            更多会员特权
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-purple-600"></div>
              <span className="text-gray-700 dark:text-gray-300">生日专属优惠</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-purple-600"></div>
              <span className="text-gray-700 dark:text-gray-300">新品优先体验</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-purple-600"></div>
              <span className="text-gray-700 dark:text-gray-300">专属会员活动</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-purple-600"></div>
              <span className="text-gray-700 dark:text-gray-300">积分双倍累积</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl">
            立即加入会员
          </button>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            加入猿素咖啡会员，开启品质生活新体验
          </p>
        </div>

        {/* Store Info */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
            <Building className="h-5 w-5" />
            <span>猿素咖啡 - 为程序员打造的专属空间</span>
          </div>
        </div>
      </div>
    </div>
  );
}