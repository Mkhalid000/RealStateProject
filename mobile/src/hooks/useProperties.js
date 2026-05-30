import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {fetchMyProperties, fetchProperties, fetchProperty} from '../lib/properties';

const LIMIT = 10;

/** Infinite public listings query driven by a filters object. */
export function usePropertiesFeed(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['properties', filters],
    queryFn: ({pageParam = 1}) =>
      fetchProperties({...filters, page: pageParam, limit: LIMIT}),
    initialPageParam: 1,
    getNextPageParam: last => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useProperty(idOrSlug) {
  return useQuery({
    queryKey: ['property', idOrSlug],
    queryFn: () => fetchProperty(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useMyProperties(verification = 'all') {
  return useQuery({
    queryKey: ['my-properties', verification],
    queryFn: () => fetchMyProperties({verification, limit: 100}),
  });
}

/** Flattens infinite-query pages into one item array. */
export function flattenPages(data) {
  return data?.pages?.flatMap(p => p.items ?? []) ?? [];
}
