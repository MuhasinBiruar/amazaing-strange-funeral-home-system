import {
  getNotificationsResponseSchema,
  getUnreadNotificationCountResponseSchema,
  type NotificationCategory,
  type NotificationReadStatus,
} from 'shared';
import { API } from './api';

export interface NotificationFilters {
  category?: NotificationCategory;
  readStatus?: NotificationReadStatus;
}

export async function getNotifications(
  page = 1,
  filters: NotificationFilters = {},
  signal?: AbortSignal,
) {
  const result = await API.get('/notifications', {
    withCredentials: true,
    signal,
    params: { page, ...filters },
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
