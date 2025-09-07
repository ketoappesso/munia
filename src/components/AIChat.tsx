'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles, RotateCcw, Image, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { ArrowLeft } from 'lucide-react';
import AIRobot from '@/svg_components/AIRobot';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
  type?: string;
}

interface AIChatProps {
  conversationId: string;
  messages: Message[];
}

export function AIChat({ conversationId, messages }: AIChatProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
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
      // If this is the first time we have messages, scroll instantly to bottom
      if (!hasInitiallyScrolled.current) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          scrollToBottom(false); // Instant scroll for initial load
          hasInitiallyScrolled.current = true;
        }, 0);
      } 
      // If we have new messages (length increased), scroll smoothly
      else if (currentMessagesLength > previousMessagesLength.current) {
        setTimeout(() => {
          scrollToBottom(true); // Smooth scroll for new messages
        }, 0);
      }
    }
    
    previousMessagesLength.current = currentMessagesLength;
  }, [messages.length]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    hasInitiallyScrolled.current = false;
    previousMessagesLength.current = 0;
  }, [conversationId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsLoading(true);
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send AI message');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setInputValue('');
      setIsLoading(false);
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessageMutation.mutate(inputValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    // Optionally clear current conversation or navigate to a fresh state
    setInputValue('');
  };

  const handleBack = () => {
    router.push('/messages');
  };

  const quickActions = [
    { text: '帮我写一份工作总结', icon: '📝' },
    { text: '解释一个概念', icon: '💡' },
    { text: '翻译成英文', icon: '🌐' },
    { text: '帮我写代码', icon: '💻' },
    { text: '创意写作', icon: '✨' },
    { text: '数据分析', icon: '📊' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-16 items-center px-4">
          <ButtonNaked
            onPress={handleBack}
            className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </ButtonNaked>
          
          <div className="ml-3 flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <AIRobot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">小猿AI</h1>
              <p className="text-sm text-green-600 dark:text-green-400">在线</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="新对话"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <AIRobot className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              你好！我是小猿AI
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              我是你的AI智能助手，可以帮你写作、翻译、编程、解答问题等。
            </p>
            
            {/* Quick Actions Grid */}
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(action.text)}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <div className="mb-1 text-lg">{action.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-4 flex ${
                  message.sender.id === session?.user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="flex max-w-[85%] items-start gap-3">
                  {message.sender.id !== session?.user?.id && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                      <AIRobot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.sender.id === session?.user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className={`mt-1 text-xs opacity-70 ${
                      message.sender.id === session?.user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex justify-start"
              >
                <div className="flex max-w-[85%] items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                    <AIRobot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
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
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Attachment Menu */}
        {showAttachmentMenu && (
          <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-3 gap-4 p-4">
              <button
                onClick={() => {
                  // TODO: Handle image upload for AI chat
                  setShowAttachmentMenu(false);
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-blue-50 p-4 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                  <Image className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300">图片</span>
              </button>
              
              <button
                onClick={() => {
                  // TODO: Handle file upload for AI chat
                  setShowAttachmentMenu(false);
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-green-50 p-4 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                  <Paperclip className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300">文件</span>
              </button>
              
              <button
                onClick={() => setShowAttachmentMenu(false)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500">
                  <X className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300">取消</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:placeholder-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-900 dark:text-white"
              rows={1}
              disabled={isLoading}
            />
          </div>

          {inputValue.trim() ? (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        
        {/* Quick Actions for when there are messages */}
        {messages.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 px-3">
            {quickActions.slice(0, 4).map((action, index) => (
              <button
                key={index}
                onClick={() => setInputValue(action.text)}
                className="whitespace-nowrap rounded-full border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {action.icon} {action.text}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}