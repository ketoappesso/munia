'use client';

import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft, Brain, Mic, Settings, MessageSquare, Database, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import Link from 'next/link';

export default function MyAIPage() {
  const router = useRouter();

  const aiModules = [
    {
      title: '语音训练',
      description: '训练专属的个人语音模型',
      icon: Mic,
      href: '/my-ai/voice-training',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      iconColor: 'text-blue-600',
    },
    {
      title: '模型选择',
      description: '选择和配置AI模型参数',
      icon: Brain,
      href: '/my-ai/model-settings',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50',
      iconColor: 'text-purple-600',
    },
    {
      title: '提示词优化',
      description: '定制AI的响应风格和行为',
      icon: MessageSquare,
      href: '/my-ai/prompt-optimization',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
    },
    {
      title: '记忆管理',
      description: '管理AI的长期记忆和知识库',
      icon: Database,
      href: '/my-ai/memory',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      iconColor: 'text-orange-600',
    },
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          我的AI助理
        </h1>
      </div>

      {/* Description */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
        <h2 className="text-xl font-semibold mb-2 text-purple-800 dark:text-purple-200">
          构建更好的自己
        </h2>
        <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
          通过个性化的AI训练，创造一个理解你、延续你风格的智能助理。从语音模拟到个性化对话，
          让AI成为真正属于你的数字分身。
        </p>
      </div>

      {/* AI Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiModules.map((module, index) => {
          const IconComponent = module.icon;
          return (
            <Link
              key={index}
              href={module.href}
              className="group block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-600"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${module.bgColor} dark:from-gray-700 dark:to-gray-600 mb-4`}>
                <IconComponent className={`h-6 w-6 ${module.iconColor} dark:text-white`} />
              </div>
              
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {module.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {module.description}
              </p>

              <div className="mt-4 flex items-center text-sm text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                开始配置
                <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">训练中的语音模型</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">活跃AI模型</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">保存的记忆条目</div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}