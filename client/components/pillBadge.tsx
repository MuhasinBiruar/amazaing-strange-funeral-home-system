import React from 'react';

export type BadgeVariant =
  'info' | 'warning' | 'error' | 'success' | 'purple' | 'indigo' | 'gray';

const variantStyles: Record<BadgeVariant, string> = {
  info: 'bg-sky-100 text-sky-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  gray: 'bg-gray-100 text-gray-700',
};

export default function PillBadge({
  variant,
  children,
}: {
  variant: BadgeVariant;
} & React.PropsWithChildren) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
