import { Loader2 } from 'lucide-react';
import { DataScroller } from 'primereact/datascroller';
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
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
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
          <DataScroller
            value={notifications}
            itemTemplate={(notif: Notification) => (
              <NotificationItem
                key={notif.notificationid}
                notif={notif}
                onSelect={onSelect}
              />
            )}
            inline
            loader
            rows={notifications.length}
            scrollHeight="calc(70vh - 4rem)"
            footer={
              hasMoreNotifications ? (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="w-full border-t border-gray-100 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:text-gray-400 disabled:cursor-wait"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
}
