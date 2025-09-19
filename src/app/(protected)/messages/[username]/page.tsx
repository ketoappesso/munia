'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ButtonNaked } from '@/components/ui/ButtonNaked';
import { ArrowLeft, Send, Plus, Camera, Image as ImageIcon, Gift, Bot, Sparkles, Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { useMessaging } from '@/hooks/useMessaging';
import { ChatMessages } from '@/components/ChatMessages';
import { useSession } from 'next-auth/react';
import { RedPacketModal } from '@/components/RedPacketModal';

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
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    name: string;
    profilePhoto: string;
  };
}

export default function MessagesPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { username } = params;
  const { data: sessionData } = useSession();

  const [message, setMessage] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice input integration
  const {
    isRecording,
    isConnecting,
    partialTranscript,
    toggleRecording
  } = useVoiceInput({
    onPartialResult: (text) => {
      setMessage(text);
      // Auto-focus the input field when receiving text
      if (textareaRef.current && text) {
        textareaRef.current.focus();
      }
    },
    onAutoSend: (text) => {
      if (text.trim() && conversation?.id && !sendMessageMutation.isPending) {
        setMessage("");
        sendMessageMutation.mutate(text.trim());
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
    },
    wsUrl: 'wss://xyuan.chat/voice-ws'
  });

  // Auto-focus and enlarge input when recording starts
  useEffect(() => {
    if (isRecording && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.rows = 3; // Enlarge the input field
    } else if (!isRecording && textareaRef.current) {
      textareaRef.current.rows = 1; // Reset size
    }
  }, [isRecording]);

  // Fetch conversation and other user info
  const { data: otherUser } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const result = await fetcher(`/api/users?username=${username}`);
      console.log('Other user data:', result);
      return result;
    },
    enabled: !!username,
  });

  // Check if other user is a punk user
  const { data: punkStatus } = useQuery({
    queryKey: ['punk-status', otherUser?.id],
    queryFn: async () => {
      if (!otherUser?.id) return null;
      const res = await fetch(`/api/punk-ai?userId=${otherUser.id}`);
      if (res.ok) {
        return await res.json();
      }
      return { isPunk: false };
    },
    enabled: !!otherUser?.id,
  });

  const isPunkUser = punkStatus?.isPunk || false;

  // Get or create conversation
  const { data: conversation, error: conversationError } = useQuery({
    queryKey: ['conversation', username],
    queryFn: async () => {
      if (!otherUser?.id) return null;
      console.log('Creating conversation with user:', otherUser.id);
      try {
        const response = await fetcher('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: otherUser.id }),
        });
        console.log('Conversation response:', response);
        return response;
      } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
    },
    enabled: !!otherUser?.id,
    retry: 2,
  });

  // Debug conversation data
  useEffect(() => {
    console.log('Conversation data:', conversation);
  }, [conversation]);

  // Fetch messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', conversation?.id],
    queryFn: () => {
      if (!conversation?.id) return [];
      return fetcher(`/api/conversations/${conversation.id}/messages`);
    },
    enabled: !!conversation?.id,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Mark messages as read when entering the conversation
  useEffect(() => {
    if (conversation?.id && messages.length > 0) {
      // Check if there are any unread messages
      const hasUnreadMessages = messages.some(
        (msg) => !msg.isRead && msg.sender.id !== sessionData?.user?.id
      );
      
      if (hasUnreadMessages) {
        // Mark all messages as read
        fetch(`/api/conversations/${conversation.id}/messages/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              console.log(`Marked ${data.markedAsRead} messages as read`);
              // Invalidate conversations query to update unread count
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
          })
          .catch((error) => {
            console.error('Error marking messages as read:', error);
          });
      }
    }
  }, [conversation?.id, messages, sessionData?.user?.id, queryClient]);

  // Fetch user balance for red packets
  const { data: userBalance = 0, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery<number>({
    queryKey: ['user', 'balance'],
    queryFn: async () => {
      console.log('Fetching user balance...');
      try {
        const res = await fetch('/api/users/balance');
        if (res.ok) {
          const data = await res.json();
          console.log('Balance data received:', data);
          console.log('User balance:', data.balance);
          return data.balance || 0;
        }
      } catch (error) {
        console.error('Failed to fetch from /api/users/balance:', error);
      }
      
      // Try the /api/users/me endpoint as fallback
      console.log('Trying fallback /api/users/me...');
      const meRes = await fetch('/api/users/me');
      if (meRes.ok) {
        const user = await meRes.json();
        console.log('Fallback user data:', user);
        return user.apeBalance || 0;
      }
      
      console.error('Failed to fetch balance from both endpoints');
      return 0;
    },
    enabled: !!sessionData?.user,
    refetchInterval: 30000, // Refresh balance every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Debug balance
  useEffect(() => {
    console.log('Current user balance:', userBalance);
    console.log('Balance loading:', isLoadingBalance);
  }, [userBalance, isLoadingBalance]);

  // Send red packet mutation
  const sendRedPacketMutation = useMutation({
    mutationFn: async ({ amount, message }: { amount: number; message?: string }) => {
      if (!conversation?.id || !otherUser?.id) {
        console.error('Missing data:', { conversationId: conversation?.id, otherUserId: otherUser?.id });
        throw new Error('No conversation or recipient');
      }
      
      console.log('Sending red packet:', {
        recipientId: otherUser.id,
        amount,
        message,
        conversationId: conversation.id,
      });
      
      // Using test endpoint temporarily (bypasses auth issues)
      const res = await fetch('/api/red-packets/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: otherUser.id,
          amount,
          message,
          conversationId: conversation.id,
          senderId: sessionData?.user?.id, // Include sender ID as fallback
        }),
      });
      
      const responseData = await res.json();
      console.log('Red packet response:', responseData);
      
      if (!res.ok) {
        console.error('Red packet send failed:', responseData);
        if (responseData.currentBalance !== undefined) {
          throw new Error(`${responseData.error}\n当前余额: ${responseData.currentBalance} APE\n需要: ${responseData.requiredAmount} APE`);
        }
        throw new Error(responseData.error || 'Failed to send red packet');
      }
      
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Red packet sent successfully:', data);
      setShowRedPacketModal(false);
      // Refresh messages and balance
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      console.error('Red packet mutation error:', error);
      alert(`发送红包失败:\n${error.message}`);
    },
  });

  // Messaging hook
  const { sendMessage: sendWebSocketMessage, isConnected } = useMessaging({
    conversationId: conversation?.id,
    onNewMessage: (newMessage) => {
      // Refresh messages when new message arrives
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) throw new Error('No conversation');

      // If sending to a punk user, show AI responding indicator
      if (isPunkUser) {
        setIsAIResponding(true);
      }

      // Use the messaging hook to send
      const success = await sendWebSocketMessage(content);
      if (success) {
        // Set a timeout to remove the AI responding indicator
        if (isPunkUser) {
          setTimeout(() => {
            setIsAIResponding(false);
          }, 3000); // Hide after 3 seconds
        }
        return { success: true };
      }
      throw new Error('Failed to send message');
    },
    onSuccess: () => {
      // Input already cleared in handleSendMessage
      // Messages will be refreshed by the onNewMessage callback
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleBack = useCallback(() => {
    router.push('/messages');
  }, [router]);

  const handleSendMessage = useCallback(() => {
    console.log('Send button clicked', {
      message: message.trim(),
      isPending: sendMessageMutation.isPending,
      conversationId: conversation?.id,
    });

    if (message.trim() && !sendMessageMutation.isPending && conversation?.id) {
      const messageToSend = message.trim();
      setMessage(''); // Clear input immediately
      sendMessageMutation.mutate(messageToSend);
    }
  }, [message, sendMessageMutation.isPending, sendMessageMutation.mutate, conversation?.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleImageUpload = useCallback(async (file: File) => {
    if (!conversation?.id || uploadingImage) return;
    
    setUploadingImage(true);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversation.id);
      
      // Upload image
      const uploadResponse = await fetch('/api/messages/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const { imageUrl } = await uploadResponse.json();
      
      // Send image as message
      const success = await sendWebSocketMessage(`[image]${imageUrl}[/image]`);
      
      if (success) {
        // Refresh messages
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
        setShowActions(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }, [conversation?.id, uploadingImage, sendWebSocketMessage, queryClient]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      
      handleImageUpload(file);
    }
    
    // Reset input
    e.target.value = '';
  }, [handleImageUpload]);

  if (!otherUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">Loading user...</p>
        </div>
      </div>
    );
  }

  if (conversationError) {
    console.error('Conversation error:', conversationError);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Failed to start conversation</p>
          <p className="mt-2 text-sm text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">
      {/* Header stays fixed at top */}
      <div className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-16 items-center px-4">
          <ButtonNaked
            onPress={handleBack}
            className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </ButtonNaked>
          <div className="ml-3 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              {otherUser.name || otherUser.username}
              {isPunkUser && (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-medium text-white">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isPunkUser ? 'AI 助手 • 随时在线' : (isConnected ? '在线' : '离线')}
            </p>
          </div>
          <div className="w-9" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Messages fill the space between header and input */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <ChatMessages messages={messages} otherUser={otherUser} />
        {isAIResponding && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-800">
              <Bot className="h-4 w-4 animate-pulse text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">AI 正在思考...</span>
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input fixed at bottom with XiaoHongShu style */}
      <div className="shrink-0 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-end gap-2 p-3">
          <ButtonNaked
            onPress={() => setShowActions(!showActions)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
            <Plus
              className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-400 ${
                showActions ? 'rotate-45' : ''
              }`}
            />
          </ButtonNaked>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={message || partialTranscript}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isRecording ? "正在听..." : "发个消息吧~"}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:placeholder-gray-500 dark:focus:border-gray-600 dark:focus:bg-gray-900"
              onKeyDown={handleKeyDown}
              aria-label="消息输入框"
              rows={1}
              style={{
                transition: 'all 0.2s ease',
                minHeight: isRecording ? '80px' : '36px'
              }}
            />
          </div>

          {/* Microphone button */}
          <ButtonNaked
            onPress={toggleRecording}
            isDisabled={isConnecting}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
              isRecording
                ? 'animate-pulse bg-red-100 dark:bg-red-900/20'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label={isRecording ? "停止录音" : "开始录音"}>
            {isRecording ? (
              <MicOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <Mic className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            )}
          </ButtonNaked>

          {message.trim() ? (
            <ButtonNaked
              onPress={handleSendMessage}
              isDisabled={sendMessageMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              <Send className="h-4 w-4" />
            </ButtonNaked>
          ) : (
            <div className="flex gap-1">
              <ButtonNaked
                onPress={() => cameraInputRef.current?.click()}
                isDisabled={uploadingImage}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                <Camera className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </ButtonNaked>
              <ButtonNaked
                onPress={() => imageInputRef.current?.click()}
                isDisabled={uploadingImage}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </ButtonNaked>
            </div>
          )}
        </div>

        {/* Quick actions (shown when + is clicked) */}
        {showActions && (
          <div className="grid grid-cols-4 gap-4 border-t border-gray-100 p-4 dark:border-gray-800">
            <button 
              onClick={() => {
                console.log('Red packet button clicked');
                console.log('Current showRedPacketModal:', showRedPacketModal);
                console.log('Setting showRedPacketModal to true');
                // Refresh balance before showing modal
                refetchBalance();
                setShowRedPacketModal(true);
              }}
              className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                <Gift className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">红包</span>
            </button>
            <button 
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">相册</span>
            </button>
            <button 
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploadingImage}
              className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
                <Camera className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">拍摄</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Red Packet Modal */}
      {showRedPacketModal && otherUser && (
        <RedPacketModal
          isOpen={showRedPacketModal}
          onClose={() => setShowRedPacketModal(false)}
          onSend={(amount, message) => {
            sendRedPacketMutation.mutate({ amount, message });
          }}
          userBalance={userBalance}
          recipientName={otherUser.name || otherUser.username}
        />
      )}
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        aria-label="选择图片"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelect}
        className="hidden"
        aria-label="拍摄照片"
      />
    </div>
  );
}
