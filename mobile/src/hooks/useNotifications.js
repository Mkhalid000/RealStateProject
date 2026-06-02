import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllRead,
} from '../lib/notifications';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 15000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: fetchUnreadCount,
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['notifications']});
    },
  });
}
