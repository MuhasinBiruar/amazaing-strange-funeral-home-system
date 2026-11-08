import type { NotificationCategory, NotificationReadStatus } from 'shared';
import type { NotificationFilters as Filters } from '@/services/notificationService';
import DateRangePicker from '@/components/dateRangePicker';

const CATEGORIES: { key: NotificationCategory | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: 'docs', label: 'Docs' },
  { key: 'payments', label: 'Payments' },
  { key: 'completed', label: 'Completed' },
  { key: 'stocks', label: 'Stocks' },
];

const READ_STATUSES: { key: NotificationReadStatus; label: string }[] = [
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:cursor-pointer ${
        active
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Category chips (one at a time, "All" clears it) plus Unread/Read chips,
 * which toggle off when clicked again, and a date range for when the
 * notifications were raised.
 */
export default function NotificationFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center gap-1.5 px-4 pt-2 overflow-x-auto">
        <ChipRow filters={filters} onChange={onChange} />
      </div>

      <div className="px-4 py-2">
        <DateRangePicker
          value={{
            from: filters.startDate ?? null,
            to: filters.endDate ?? null,
          }}
          placeholder="Any date"
          onApply={(startDate, endDate) =>
            onChange({ ...filters, startDate, endDate })
          }
          onClear={() =>
            onChange({ ...filters, startDate: undefined, endDate: undefined })
          }
        />
      </div>
    </div>
  );
}

function ChipRow({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <>
      {CATEGORIES.map(({ key, label }) => (
        <Chip
          key={label}
          label={label}
          active={filters.category === key}
          onClick={() => onChange({ ...filters, category: key })}
        />
      ))}

      <span className="shrink-0 w-px h-4 mx-1 bg-gray-200" aria-hidden="true" />

      {READ_STATUSES.map(({ key, label }) => (
        <Chip
          key={key}
          label={label}
          active={filters.readStatus === key}
          onClick={() =>
            onChange({
              ...filters,
              readStatus: filters.readStatus === key ? undefined : key,
            })
          }
        />
      ))}
    </>
  );
}
