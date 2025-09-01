import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useMessagesUnreadCountQuery() {
  const { data: session } = useSession();

  return useQuery<number>({
    queryKey: ['messagesUnreadCount'],
    queryFn: async () => {
      if (!session?.user) return 0;
      
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const conversations = await response.json();
      
      // 计算所有对话的未读消息总数
      const totalUnread = conversations.reduce((sum: number, conv: any) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      
      return totalUnread;
    },
    refetchInterval: 3000, // 每3秒刷新一次
    refetchOnWindowFocus: true, // 窗口获得焦点时刷新
    enabled: !!session?.user,
  });
}
