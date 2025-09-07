'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, Image, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { useSession } from 'next-auth/react';
import { useUserQuery } from '@/hooks/queries/useUserQuery';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export default function AIPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: user } = useUserQuery(session?.user?.id);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是你的AI助手。有什么可以帮助你的吗？',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousMessagesLength = useRef<number>(0);
  const hasInitiallyScrolled = useRef<boolean>(false);

  const scrollToBottom = (smooth: boolean = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    });
  };

  useEffect(() => {
    const currentMessagesLength = messages.length;
    
    if (currentMessagesLength > 0) {
      // 如果是第一次有消息，瞬间滚动到底部
      if (!hasInitiallyScrolled.current) {
        // 使用 setTimeout 确保 DOM 已更新
        setTimeout(() => {
          scrollToBottom(false); // 初始加载时瞬间滚动
          hasInitiallyScrolled.current = true;
        }, 0);
      } 
      // 如果有新消息（数量增加），平滑滚动
      else if (currentMessagesLength > previousMessagesLength.current) {
        setTimeout(() => {
          scrollToBottom(true); // 新消息时平滑滚动
        }, 0);
      }
    }
    
    previousMessagesLength.current = currentMessagesLength;
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      const data = await response.json();

      // Remove loading message and add actual response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            content: data.response || '抱歉，我现在无法回答。请稍后再试。',
            role: 'assistant',
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove loading message and add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            content: '抱歉，发生了错误。请稍后再试。',
            role: 'assistant',
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        content: '你好！我是你的AI助手。有什么可以帮助你的吗？',
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900 md:rounded-lg md:border md:border-gray-200 dark:md:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:rounded-t-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="新对话"
          >
            <Plus className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">AI 助手</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="菜单"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`mb-4 flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-gray-400"
                    />
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, delay: 0.2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-gray-400"
                    />
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, delay: 0.4, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-gray-400"
                    />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <p className="mt-1 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:rounded-b-lg">
        <div className="flex items-end gap-2">
          <button
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="添加附件"
          >
            <Paperclip className="h-5 w-5 text-gray-500" />
          </button>
          <button
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="添加图片"
          >
            <Image className="h-5 w-5 text-gray-500" />
          </button>
          
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="max-h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`rounded-lg p-2 transition-colors ${
              inputValue.trim() && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
            }`}
            title="发送"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setInputValue('帮我写一份工作总结')}
            className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            📝 写总结
          </button>
          <button
            onClick={() => setInputValue('解释一下这个概念：')}
            className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            💡 解释概念
          </button>
          <button
            onClick={() => setInputValue('翻译成英文：')}
            className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            🌐 翻译
          </button>
          <button
            onClick={() => setInputValue('帮我写代码：')}
            className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            💻 写代码
          </button>
        </div>
      </div>

      {/* UnifiedSidebar */}
      <UnifiedSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isOwnProfile={true}
        username={user?.username || ''}
        currentPage="ai"
        showTabs={false}
        showNavigation={true}
        showProfileActions={true}
      />
    </div>
  );
}
