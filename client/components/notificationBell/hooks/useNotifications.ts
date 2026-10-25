'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Notification } from 'shared';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(authenticated: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listControllerRef = useRef<AbortController | null>(null);

  const refreshCount = useCallback(() => {
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {
        // Polling failures are non-fatal; the next tick retries.
      });
  }, []);

  // Poll the unread count and refresh when the tab becomes visible.
  useEffect(() => {
    if (!authenticated) return;

    refreshCount();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshCount();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshCount();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authenticated, refreshCount]);

  const cancelListRequest = useCallback(() => {
    listControllerRef.current?.abort();
    listControllerRef.current = null;
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Load the first page whenever the dropdown opens.
  const loadNotifications = useCallback(() => {
    cancelListRequest();

    const controller = new AbortController();
    listControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setNotificationPage(1);
    setHasMoreNotifications(false);

    getNotifications(1, controller.signal)
      .then((result) => {
        setNotifications(result.data);
        setUnreadCount(result.meta.unreadCount);
        setHasMoreNotifications(result.meta.hasMore);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        console.error(err);
        setError('Failed to load notifications.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [cancelListRequest]);

  useEffect(() => () => listControllerRef.current?.abort(), []);

  const loadMoreNotifications = useCallback(() => {
    if (loadingMore || !hasMoreNotifications) return;

    const nextPage = notificationPage + 1;
    const controller = new AbortController();

    listControllerRef.current?.abort();
    listControllerRef.current = controller;

    setLoadingMore(true);

    getNotifications(nextPage, controller.signal)
      .then((result) => {
        setNotifications((prev) => [...prev, ...result.data]);
        setNotificationPage(nextPage);
        setHasMoreNotifications(result.meta.hasMore);
        setUnreadCount(result.meta.unreadCount);
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMore(false);
      });
  }, [loadingMore, hasMoreNotifications, notificationPage]);

  const markAsRead = useCallback(
    (notifId: Notification['notificationid']) => {
      // Update the UI immediately.
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationid === notifId ? { ...notif, isread: true } : notif,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));

      markNotificationRead(notifId).catch(() => {
        refreshCount();
      });
    },
    [refreshCount],
  );

  const markAllRead = useCallback(async () => {
    // Update the UI immediately.
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isread: true,
      })),
    );

    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      refreshCount();
    }
  }, [refreshCount]);

  return {
    unreadCount,
    notifications,
    loading,
    loadingMore,
    error,
    hasMoreNotifications,
    refreshCount,
    loadNotifications,
    cancelListRequest,
    loadMoreNotifications,
    markAsRead,
    markAllRead,
  };
}
