import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import NotificationItem from './notificationItem';
import type { Notification } from 'shared';

export default function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  loadingMore,
  error,
  hasMoreNotifications,
  onSelect,
  onMarkAllRead,
  onLoadMore,
}: {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMoreNotifications: boolean;
  onSelect: (notification: Notification) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  // Avoid recreating observer simply because onLoadMore changes
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const trigger = loadMoreTriggerRef.current;

    if (
      !root ||
      !trigger ||
      loading ||
      loadingMore ||
      error ||
      !hasMoreNotifications
    )
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMoreRef.current();
      },
      {
        root,
        // Start fetching before the user reaches the bottom.
        rootMargin: '0px 0px 100px 0px',
        threshold: 0,
      },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [loading, loadingMore, error, hasMoreNotifications]);

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="font-semibold text-sm text-gray-800">
          Notifications
        </span>

        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-xs font-medium text-indigo-600 hover:underline hover:cursor-pointer disabled:text-gray-400 disabled:no-underline disabled:cursor-default"
        >
          Mark all as read
        </button>
      </header>

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
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(70vh - 4rem)' }}
        >
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.notificationid}
              notif={notif}
              onSelect={onSelect}
            />
          ))}

          {loadingMore && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              Loading...
            </div>
          )}

          {hasMoreNotifications && (
            <div ref={loadMoreTriggerRef} className="h-px" aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  );
}
