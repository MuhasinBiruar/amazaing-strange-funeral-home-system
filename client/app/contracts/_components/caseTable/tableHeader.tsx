import { Search } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { NullableDeceasedStatus } from './types';

const STATUS_OPTIONS: { label: string; value: NullableDeceasedStatus }[] = [
  { label: 'All statuses', value: null },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Intake', value: 'intake' },
  { label: 'Pending', value: 'pending' },
];

export default function TableHeader({
  total,
  search,
  setSearch,
  deceasedStatus,
  setDeceasedStatus,
  setPage,
  commitDboSearch,
}: {
  total: number;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  deceasedStatus: NullableDeceasedStatus;
  setDeceasedStatus: Dispatch<SetStateAction<NullableDeceasedStatus>>;
  setPage: Dispatch<SetStateAction<number>>;
  commitDboSearch: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-200">
      <div>
        <h2 className="text-base font-serif font-semibold text-gray-900">
          Log
        </h2>
        <p className="text-xs text-gray-400">{total} items</p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={deceasedStatus ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            setDeceasedStatus(
              value === '' ? null : (value as NullableDeceasedStatus),
            );
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDboSearch();
            }}
            placeholder="Search contracts..."
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder:text-gray-400!"
          />
        </div>
        <button
          onClick={commitDboSearch}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 cursor-pointer"
        >
          Search
        </button>
      </div>
    </div>
  );
}
