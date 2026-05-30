import {useInfiniteQuery} from '@tanstack/react-query';
import {fetchReelFeed} from '../lib/reels';

const LIMIT = 6;

export function useReelFeed() {
  return useInfiniteQuery({
    queryKey: ['reels-feed'],
    queryFn: ({pageParam = 1}) => fetchReelFeed({page: pageParam, limit: LIMIT}),
    initialPageParam: 1,
    getNextPageParam: last => (last.hasMore ? last.page + 1 : undefined),
  });
}
