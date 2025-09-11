'use client';

import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft, Brain, Settings, Zap, Target, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function ModelSettingsPage() {
  const router = useRouter();
  
  const [selectedModel, setSelectedModel] = useState('deepseek-v3');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [topP, setTopP] = useState(0.9);

  const models = [
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3.1',
      provider: 'DeepSeek',
      description: '高性价比选择，强大的中文能力',
      features: ['中文优化', '成本效益', '快速响应'],
      recommended: true,
      default: true,
    },
    {
      id: 'qwen',
      name: 'Qwen',
      provider: '阿里云',
      description: '通义千问，全面的语言理解与生成能力',
      features: ['中文理解', '多模态支持', '代码生成'],
      recommended: false,
    },
    {
      id: 'kimi-v2',
      name: 'Kimi V2',
      provider: 'Moonshot',
      description: '超长上下文处理，适合文档分析',
      features: ['200K上下文', '文档理解', '精准回答'],
      recommended: false,
    },
    {
      id: 'doubao',
      name: '豆包',
      provider: '字节跳动',
      description: '快速响应，日常对话首选',
      features: ['快速响应', '日常对话', '创意写作'],
      recommended: false,
    },
    {
      id: 'gpt-4',
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      description: '最强大的通用语言模型，适合复杂推理和创作',
      features: ['强大推理能力', '多语言支持', '代码生成'],
      recommended: false,
    },
    {
      id: 'gpt-5',
      name: 'GPT-5',
      provider: 'OpenAI',
      description: '下一代AI模型，超越想象的智能体验',
      features: ['超强推理', '完美理解', '创新思维'],
      recommended: false,
      isPremium: true,
    },
  ];

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving model settings:', {
      selectedModel,
      temperature,
      maxTokens,
      topP,
    });
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
          <Brain className="h-8 w-8 text-purple-600" />
          模型选择与配置
        </h1>
      </div>

      <div className="space-y-8">
        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            选择AI模型
          </h2>
          
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedModel === model.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600'
                }`}
                onClick={() => {
                  if (model.isPremium) {
                    router.push('/my-ai/membership-upgrade');
                  } else {
                    setSelectedModel(model.id);
                  }
                }}
              >
                {model.recommended && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    推荐
                  </div>
                )}
                
                {model.default && (
                  <div className="absolute -top-2 left-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    默认
                  </div>
                )}
                
                {model.isPremium && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    会员专属
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {model.name}
                      {model.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">{model.provider}</p>
                  </div>
                  
                  {!model.isPremium && (
                    <input
                      type="radio"
                      checked={selectedModel === model.id}
                      onChange={() => setSelectedModel(model.id)}
                      className="w-5 h-5 text-purple-600"
                    />
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-3">{model.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {model.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Parameters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            模型参数
          </h2>
          
          <div className="space-y-6">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature (创造性): {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>保守 (0.0)</span>
                <span>平衡 (0.7)</span>
                <span>创新 (1.0)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium mb-2">
                最大输出长度: {maxTokens} tokens
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>短回答 (100)</span>
                <span>标准 (2000)</span>
                <span>长回答 (4000)</span>
              </div>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Top P (多样性): {topP}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>专注 (0.1)</span>
                <span>均衡 (0.9)</span>
                <span>多样 (1.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            性能预览
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">响应速度</span>
              <div className="font-semibold text-green-600">快</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">创造性</span>
              <div className="font-semibold text-orange-600">中等</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">准确性</span>
              <div className="font-semibold text-blue-600">高</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">成本</span>
              <div className="font-semibold text-purple-600">适中</div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button mode="secondary" onPress={() => router.back()}>
            取消
          </Button>
          <Button onPress={handleSave}>
            保存设置
          </Button>
        </div>
      </div>
    </ResponsiveContainer>
  );
}