import Link from 'next/link';
import Image from 'next/image';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'Munia | Messages',
};

export default async function Page() {
  const [user] = await getServerUser();

  if (!user) return null;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participant1Id: user.id },
        { participant2Id: user.id }
      ]
    },
    select: {
      id: true,
      participant1: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePhoto: true,
        }
      },
      participant2: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePhoto: true,
        }
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          isRead: true,
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePhoto: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: {
                not: user.id
              }
            }
          }
        }
      }
    },
    orderBy: {
      lastMessageAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 pt-4 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <div className="mt-8 rounded-lg bg-white p-6 text-center dark:bg-gray-800">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No conversations</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start a conversation by messaging someone from their profile</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherUser = conversation.participant1Id === user.id 
                ? conversation.participant2 
                : conversation.participant1;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${otherUser.username}`}
                  className="block rounded-lg bg-white p-4 shadow-sm transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <Image
                        src={otherUser.profilePhoto || '/images/default-avatar.jpg'}
                        alt={otherUser.name || otherUser.username!}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      {conversation._count.messages > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                          {conversation._count.messages}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {otherUser.name || otherUser.username}
                      </p>
                      {conversation.messages[0] && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conversation.messages[0].content}
                        </p>
                      )}
                    </div>

                    {conversation.messages[0]?.createdAt && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(conversation.messages[0].createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
