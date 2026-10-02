import {
  getNotificationsResponseSchema,
  getUnreadNotificationCountResponseSchema,
} from 'shared';
import { API } from './api';

export async function getNotifications(signal?: AbortSignal) {
  const result = await API.get('/notifications', {
    withCredentials: true,
    signal,
  });
  return getNotificationsResponseSchema.parse(result.data);
}

export async function getUnreadNotificationCount(signal?: AbortSignal) {
  const result = await API.get('/notifications/unread-count', {
    withCredentials: true,
    signal,
  });
  return getUnreadNotificationCountResponseSchema.parse(result.data).data
    .unreadCount;
}

export async function markNotificationRead(notificationid: number) {
  await API.patch(`/notifications/${notificationid}/read`, undefined, {
    withCredentials: true,
  });
}

export async function markAllNotificationsRead() {
  await API.patch('/notifications/read-all', undefined, {
    withCredentials: true,
  });
}
