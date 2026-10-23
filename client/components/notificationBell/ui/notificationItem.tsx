'use client';

import {
  type LucideIcon,
  FileCheck2,
  Banknote,
  BellRing,
  TriangleAlert,
  FlaskConical,
  Box,
} from 'lucide-react';
import type { Notification, NotificationType } from 'shared';

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

export default function NotificationItem({
  notif,
  onSelect,
}: {
  notif: Notification;
  onSelect: (notif: Notification) => void;
}) {
  const { icon: Icon, className } = TYPE_STYLES[notif.type];

  return (
    <button
      type="button"
      onClick={() => onSelect(notif)}
      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 hover:cursor-pointer transition-colors ${
        notif.isread ? '' : 'bg-indigo-50/60'
      }`}
    >
      <Icon
        size={18}
        className={`shrink-0 mt-0.5 ${
          notif.resolvedat ? 'text-gray-400' : className
        }`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm truncate ${
              notif.isread ? 'text-gray-700' : 'font-semibold text-gray-900'
            }`}
          >
            {notif.title}
          </span>

          {notif.resolvedat && (
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              Resolved
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>

        <p className="text-[11px] text-gray-400 mt-1">
          {timeAgo(notif.createdat)}
        </p>
      </div>

      {!notif.isread && (
        <span className="shrink-0 mt-1.5 size-2 rounded-full bg-indigo-600" />
      )}
    </button>
  );
}
