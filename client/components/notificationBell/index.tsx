'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import type { Notification } from 'shared';
import { useAuth } from '@/contexts/AuthProvider';
import NotificationDropdown from './ui/notificationDropdown';
import { useNotifications } from './hooks/useNotifications';

export default function NotificationBell() {
  const router = useRouter();
  const { status } = useAuth();
  const authenticated = status === 'authenticated';

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    unreadCount,
    notifications,
    loading,
    loadingMore,
    error,
    hasMoreNotifications,
    loadNotifications,
    cancelListRequest,
    loadMoreNotifications,
    markAsRead,
    markAllRead,
  } = useNotifications(authenticated);

  // Load the list each time the dropdown opens.
  const toggleOpen = () => {
    if (open) {
      cancelListRequest();
      setOpen(false);
      return;
    }

    setOpen(true);
    loadNotifications();
  };

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

  const handleSelect = (notif: Notification) => {
    if (!notif.isread) {
      markAsRead(notif.notificationid);
    }

    if (notif.link) {
      setOpen(false);
      router.push(notif.link, { scroll: false });
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
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMoreNotifications={hasMoreNotifications}
          onSelect={handleSelect}
          onMarkAllRead={markAllRead}
          onLoadMore={loadMoreNotifications}
        />
      )}
    </div>
  );
}
