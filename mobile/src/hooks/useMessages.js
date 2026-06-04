import {useQuery} from '@tanstack/react-query';
import {fetchUnreadMessageCount} from '../lib/messages';
import {useAuthStore} from '../store/authStore';

export function useUnreadMessageCount() {
  const user = useAuthStore(s => s.user);
  return useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: fetchUnreadMessageCount,
    enabled: !!user,
    refetchInterval: 15000,
  });
}
