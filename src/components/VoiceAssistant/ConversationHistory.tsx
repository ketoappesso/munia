'use client';

import React, { useRef, useEffect } from 'react';
import { User, Bot, Mic, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface ConversationHistoryProps {
  messages: Message[];
  currentTranscript?: string;
  isListening?: boolean;
  className?: string;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  messages,
  currentTranscript,
  isListening,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Play audio message
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  return (
    <div
      ref={scrollRef}
      className={`flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${className}`}
    >
      <div className="flex-1 p-4 space-y-4">
        {/* Welcome message if no messages */}
        {messages.length === 0 && !currentTranscript && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <Bot size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              准备开始对话
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              点击麦克风按钮开始录音，我会实时识别并回应您的话语
            </p>
          </div>
        )}

        {/* Message List */}
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={`${message.timestamp.getTime()}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {message.role === 'user' ? (
                  <User size={16} className="text-white" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col gap-1 max-w-[70%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.audioUrl && (
                    <button
                      onClick={() => playAudio(message.audioUrl!)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="播放音频"
                    >
                      <Volume2 size={12} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Current Transcript (while listening) */}
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 flex-row-reverse"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>

            <div className="flex flex-col gap-1 max-w-[70%] items-end">
              <div className="px-4 py-2 rounded-2xl bg-blue-600/50 text-white border border-blue-500">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {currentTranscript}
                  {isListening && (
                    <span className="inline-block ml-1">
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        _
                      </motion.span>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 px-1">
                <Mic size={12} className="text-blue-400 animate-pulse" />
                <span className="text-xs text-gray-500">正在录音...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Typing Indicator */}
        {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gray-700">
              <div className="flex gap-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;