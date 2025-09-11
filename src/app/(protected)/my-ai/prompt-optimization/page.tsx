'use client';

import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChevronLeft, MessageSquare, Wand2, User, Bot, Copy, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function PromptOptimizationPage() {
  const router = useRouter();
  
  const [systemPrompt, setSystemPrompt] = useState('你是一个友善、智慧的AI助理，总是乐于帮助用户解决问题。请用温和、专业的语调回答用户的问题。');
  const [selectedRole, setSelectedRole] = useState('assistant');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roleTemplates = [
    {
      id: 'assistant',
      name: '智能助理',
      description: '友善、专业的日常助理',
      prompt: '你是一个友善、智慧的AI助理，总是乐于帮助用户解决问题。请用温和、专业的语调回答用户的问题。',
      personality: '友善、耐心、专业',
    },
    {
      id: 'consultant',
      name: '专业顾问',
      description: '提供深度分析和建议',
      prompt: '你是一位经验丰富的专业顾问，擅长分析复杂问题并提供深入的见解和实用的建议。请保持客观、理性的分析态度。',
      personality: '理性、深刻、权威',
    },
    {
      id: 'friend',
      name: '贴心朋友',
      description: '温暖、支持的朋友角色',
      prompt: '你是用户的贴心朋友，总是给予温暖的支持和鼓励。用轻松、亲近的语调与用户交流，分享感受和想法。',
      personality: '温暖、支持、亲近',
    },
    {
      id: 'creative',
      name: '创意伙伴',
      description: '激发创意和灵感',
      prompt: '你是一个充满创意的伙伴，善于激发灵感、提供新颖的想法。用富有想象力和激情的语言与用户交流。',
      personality: '创新、激情、灵感',
    },
  ];

  const contextScenarios = [
    {
      name: '工作咨询',
      prompt: '在工作相关的话题中，请提供专业、实用的建议，关注效率和结果。',
    },
    {
      name: '学习辅导',
      prompt: '在学习相关的话题中，请耐心解释概念，提供清晰的步骤和例子。',
    },
    {
      name: '生活娱乐',
      prompt: '在休闲娱乐的话题中，请保持轻松愉快的语调，分享有趣的见解。',
    },
    {
      name: '情感支持',
      prompt: '在情感相关的话题中，请给予理解和支持，避免冷漠的回应。',
    },
  ];

  const handleRoleChange = (role: typeof roleTemplates[0]) => {
    setSelectedRole(role.id);
    setSystemPrompt(role.prompt);
  };

  const handleTestPrompt = async () => {
    if (!testMessage.trim()) {
      alert('请输入测试消息');
      return;
    }

    setTestResponse('正在生成回复...');
    
    try {
      const response = await fetch('/api/ai/prompt-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          testMessage
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setTestResponse(`错误: ${error.error || '无法生成回复'}`);
        return;
      }

      const data = await response.json();
      setTestResponse(data.response);
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestResponse('测试失败，请检查网络连接后重试');
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt);
  };

  const resetPrompt = () => {
    const currentRole = roleTemplates.find(role => role.id === selectedRole);
    if (currentRole) {
      setSystemPrompt(currentRole.prompt);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/ai/prompt-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          role: selectedRole
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`保存失败: ${error.error || '未知错误'}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert('设置已保存成功！');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
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
          <MessageSquare className="h-8 w-8 text-green-600" />
          提示词优化
        </h1>
      </div>

      <div className="space-y-8">
        {/* Role Templates */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            AI角色模板
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleTemplates.map((role) => (
              <div
                key={role.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRole === role.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-200 dark:hover:border-green-600'
                }`}
                onClick={() => handleRoleChange(role)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{role.name}</h3>
                  <input
                    type="radio"
                    checked={selectedRole === role.id}
                    onChange={() => handleRoleChange(role)}
                    className="w-4 h-4 text-green-600"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{role.description}</p>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {role.personality}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Prompt Editor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              系统提示词
            </h2>
            <div className="flex gap-2">
              <ButtonNaked
                onPress={copyPrompt}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="复制提示词">
                <Copy className="h-4 w-4" />
              </ButtonNaked>
              <ButtonNaked
                onPress={resetPrompt}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="重置为默认">
                <RotateCcw className="h-4 w-4" />
              </ButtonNaked>
            </div>
          </div>
          
          <Textarea
            label=""
            value={systemPrompt}
            onChange={setSystemPrompt}
            placeholder="在这里编辑系统提示词，定义AI的基本行为和性格..."
            className="min-h-[120px]"
          />
          
          <p className="text-xs text-gray-500 mt-2">
            系统提示词定义了AI的基本人格和行为模式，影响所有对话的响应风格。
          </p>
        </div>

        {/* Context Scenarios */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">场景化提示词</h2>
          
          <div className="space-y-4">
            {contextScenarios.map((scenario, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium mb-2">{scenario.name}</h3>
                <Textarea
                  label=""
                  value={scenario.prompt}
                  onChange={() => {}}
                  className="min-h-[60px] text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Test Area */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-100 dark:border-yellow-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-orange-600" />
            实时测试
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">测试消息</label>
              <Textarea
                label=""
                value={testMessage}
                onChange={setTestMessage}
                placeholder="输入一条测试消息，看看AI会如何回应..."
                className="min-h-[80px]"
              />
            </div>
            
            <Button onPress={handleTestPrompt} className="w-full md:w-auto">
              测试当前提示词
            </Button>
            
            {testResponse && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium mb-2">AI回复</label>
                <p className="text-gray-700 dark:text-gray-300">{testResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button mode="secondary" onPress={() => router.back()}>
            取消
          </Button>
          <Button onPress={handleSaveSettings} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>
    </ResponsiveContainer>
  );
}