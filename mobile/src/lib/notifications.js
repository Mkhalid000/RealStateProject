import {api} from './api';

/** Recent notifications for the signed-in user. */
export async function fetchNotifications() {
  const {data} = await api.get('/notifications');
  return data; // Notification[]
}

export async function fetchUnreadCount() {
  const {data} = await api.get('/notifications/unread-count');
  return data; // {count}
}

export async function markAllRead() {
  const {data} = await api.patch('/notifications/read-all');
  return data;
}

/** Register / remove this device's FCM token for push. */
export async function registerDeviceToken(token, platform = 'android') {
  const {data} = await api.post('/notifications/device-token', {token, platform});
  return data;
}

export async function removeDeviceToken(token) {
  const {data} = await api.delete('/notifications/device-token', {
    data: {token},
  });
  return data;
}
