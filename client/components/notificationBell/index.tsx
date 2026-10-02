'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Bell,
  BellRing,
  Box,
  FileCheck2,
  FlaskConical,
  Loader2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { Notification, NotificationType } from 'shared';
import { useAuth } from '@/contexts/AuthProvider';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';

const POLL_INTERVAL_MS = 30_000;

const TYPE_STYLES: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  documents_complete: { icon: FileCheck2, className: 'text-green-600' },
  full_payment: { icon: Banknote, className: 'text-green-600' },
  payment_reminder: { icon: BellRing, className: 'text-amber-600' },
  advanced_decomposition: {
    icon: TriangleAlert,
    className: 'text-amber-600',
  },
  low_formalin: { icon: FlaskConical, className: 'text-red-600' },
  low_casket: { icon: Box, className: 'text-red-600' },
};

function timeAgo(date: Date) {
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Header bell showing how many unread notifications the signed-in staff
 * member has. The server only returns notifications addressed to pages this
 * person can access (admins see all), so the count is already per-person.
 */
export default function NotificationBell() {
  const router = useRouter();
  const { status } = useAuth();
  const authenticated = status === 'authenticated';

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(() => {
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {
        // Polling failures are non-fatal; the next tick retries.
      });
  }, []);

  // Poll the unread count, and refresh immediately when the tab regains focus.
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

  const listControllerRef = useRef<AbortController | null>(null);

  // Load the list each time the dropdown opens.
  const toggleOpen = () => {
    listControllerRef.current?.abort();
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    const controller = new AbortController();
    listControllerRef.current = controller;
    setLoading(true);
    setError(null);
    getNotifications(controller.signal)
      .then((result) => {
        setNotifications(result.data);
        setUnreadCount(result.meta.unreadCount);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setError('Failed to load notifications.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  };

  useEffect(() => () => listControllerRef.current?.abort(), []);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = async (notification: Notification) => {
    if (!notification.isread) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationid === notification.notificationid
            ? { ...n, isread: true }
            : n,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      markNotificationRead(notification.notificationid).catch(() => {
        refreshCount();
      });
    }

    if (notification.link) {
      setOpen(false);
      router.push(notification.link, { scroll: false });
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isread: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      refreshCount();
    }
  };

  if (!authenticated) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : 'Notifications'
        }
        aria-expanded={open}
        className="relative p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:cursor-pointer transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-4.5 text-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-semibold text-sm text-gray-800">
              Notifications
            </span>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-indigo-600 hover:underline hover:cursor-pointer disabled:text-gray-400 disabled:no-underline disabled:cursor-default"
            >
              Mark all as read
            </button>
          </div>

          <div className="overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                Loading...
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-red-600">{error}</p>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const { icon: Icon, className } = TYPE_STYLES[n.type];
                  return (
                    <li key={n.notificationid}>
                      <button
                        type="button"
                        onClick={() => handleSelect(n)}
                        className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 hover:cursor-pointer transition-colors ${
                          n.isread ? '' : 'bg-indigo-50/60'
                        }`}
                      >
                        <Icon
                          size={18}
                          className={`shrink-0 mt-0.5 ${n.resolvedat ? 'text-gray-400' : className}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm truncate ${
                                n.isread
                                  ? 'text-gray-700'
                                  : 'font-semibold text-gray-900'
                              }`}
                            >
                              {n.title}
                            </span>
                            {n.resolvedat && (
                              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {timeAgo(n.createdat)}
                          </p>
                        </div>
                        {!n.isread && (
                          <span className="shrink-0 mt-1.5 size-2 rounded-full bg-indigo-600" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
