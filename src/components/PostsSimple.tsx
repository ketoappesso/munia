'use client';

import { GetPost } from '@/types/definitions';
import { useEffect, useState } from 'react';
import { Post } from './Post';
import { GenericLoading } from './GenericLoading';
import { SomethingWentWrong } from './SometingWentWrong';

type PostsProps =
  | {
      type: 'hashtag';
      userId?: undefined;
      hashtag: string;
    }
  | {
      type: 'profile' | 'feed';
      userId: string;
      hashtag?: undefined;
    }
  | {
      type: 'public' | 'tasks';
      userId?: undefined;
      hashtag?: undefined;
    };

export function Posts({ type, hashtag, userId }: PostsProps) {
  const [posts, setPosts] = useState<GetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        console.log('🔍 Fetching posts directly...');
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', '20');
        params.set('cursor', '0');
        params.set('sort-direction', 'desc');

        const fetchUrl =
          type === 'hashtag'
            ? `/api/posts/hashtag/${hashtag}`
            : type === 'public'
            ? '/api/posts'
            : type === 'tasks'
            ? '/api/posts/tasks'
            : `/api/users/${userId}/${type === 'profile' ? 'posts' : 'feed'}`;

        const url = `${fetchUrl}?${params.toString()}`;
        console.log('🔍 Fetching from:', url);

        const response = await fetch(url);
        console.log('📊 Response status:', response.status, response.ok);

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }

        const data = await response.json() as GetPost[];
        console.log('📊 Posts received:', data.length);
        setPosts(data);
      } catch (err) {
        console.error('❌ Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [type, hashtag, userId]);

  if (loading) {
    return <GenericLoading>Loading posts</GenericLoading>;
  }

  if (error) {
    return <SomethingWentWrong />;
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No posts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-4">
      {posts.map((post) => {
        // Create a simple post ID object that matches the Post component expectations
        const postId = {
          id: post.id,
          commentsShown: false,
        };

        return (
          <div key={post.id} className="col-span-1">
            <Post
              id={post.id}
              commentsShown={false}
              toggleComments={async () => {
                // Simple toggle - in a real app this would be more sophisticated
                console.log('Toggle comments for post:', post.id);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}