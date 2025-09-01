'use client';

import useOnScreen from '@/hooks/useOnScreen';
import { InfiniteData, QueryKey, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { GetActivity } from '@/types/definitions';
import { Activity } from '@/components/Activity';
import { AllCaughtUp } from '@/components/AllCaughtUp';
import { NO_PREV_DATA_LOADED } from '@/constants';
import { GenericLoading } from '@/components/GenericLoading';
import { SomethingWentWrong } from '@/components/SometingWentWrong';
import { getNotifications } from '@/lib/client_data_fetching/getNotifications';

export function Notifications({ userId }: { userId: string }) {
  const bottomElRef = useRef<HTMLDivElement>(null);
  const isBottomOnScreen = useOnScreen(bottomElRef);
  const { data, error, isPending, isError, fetchNextPage, isFetchingNextPage, hasNextPage, fetchPreviousPage } =
    useInfiniteQuery<GetActivity[], Error, InfiniteData<GetActivity[], unknown>, QueryKey, number>({
      queryKey: ['users', userId, 'notifications'],
      defaultPageParam: 0,
      queryFn: async ({ pageParam: cursor, direction }) => {
        const activities = await getNotifications({
          userId,
          cursor,
          direction,
        });

        const isForwards = direction === 'forward';
        if (!activities.length && !isForwards) {
          // Prevent React Query from 'prepending' the data with an empty array
          throw new Error(NO_PREV_DATA_LOADED);
        }

        // If the direction is backwards, `activities` need to be reversed
        // to make sure that the latest activity is shown at the top
        return isForwards ? activities : activities.reverse();
      },
      getNextPageParam: (lastPage, pages) => {
        // If the `pages` `length` is 0, that means there is not a single activity to load
        if (pages.length === 0) return undefined;

        // If the last page doesn't have activities, that means the end is reached
        if (lastPage.length === 0) return undefined;

        // Return the `id` of the last activity, this will serve as the cursor
        // that will be passed to `queryFn` as the `pageParam` property
        return lastPage.slice(-1)[0].id;
      },
      getPreviousPageParam: (firstPage) => {
        if (!firstPage?.length) return 0;
        return firstPage[0].id;
      },
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      enabled: !!userId,
    });

  useEffect(() => {
    if (isBottomOnScreen && hasNextPage) fetchNextPage();
  }, [isBottomOnScreen, hasNextPage, fetchNextPage]);

  useEffect(() => {
    const interval = setInterval(fetchPreviousPage, 5000);
    return () => clearInterval(interval);
  }, [fetchPreviousPage]);

  const bottomLoaderStyle = useMemo(() => ({ display: data ? 'block' : 'none' }), [data]);

  return (
    <div>
      <div>
        {isPending ? (
          <GenericLoading>Loading notifications</GenericLoading>
        ) : (
          data?.pages.flat().map((activity) => <Activity key={activity.id} {...activity} />)
        )}
      </div>

      <div
        className="min-h-[16px]"
        ref={bottomElRef}
        /**
         * The first page will be initially loaded by React Query
         * so the bottom loader has to be hidden first
         */
        style={bottomLoaderStyle}>
        {isFetchingNextPage && <GenericLoading>Loading more notifications</GenericLoading>}
      </div>
      {isError && error.message !== NO_PREV_DATA_LOADED && <SomethingWentWrong />}
      {!isPending && !isFetchingNextPage && !hasNextPage && <AllCaughtUp />}
    </div>
  );
}
