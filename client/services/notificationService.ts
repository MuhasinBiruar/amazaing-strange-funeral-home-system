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

const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

/**
 * Tells the bell to re-check its unread count now rather than at its next
 * poll, e.g. after recording something that can raise a notification.
 */
export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

/** @returns A function that stops listening. */
export function onNotificationsChanged(listener: () => void) {
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, listener);
  return () =>
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, listener);
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
