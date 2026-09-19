'use client';

import { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import type { Nullable } from 'primereact/ts-helpers';

export default function DateRangePicker({
  onApply,
}: {
  onApply: (startDate: string, endDate: string) => void;
}) {
  const [dates, setDates] = useState<Nullable<(Date | null)[]>>(null);

  const handleApply = () => {
    // PrimeReact range selection returns an array: [startDate, endDate]
    if (dates && dates[0] && dates[1]) {
      
      // Convert standard JS Dates to local yyyy-MM-dd strings
      const formatToIso = (d: Date) => {
        const offsetMs = d.getTimezoneOffset() * 60 * 1000;
        return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
      };

      onApply(formatToIso(dates[0]), formatToIso(dates[1]));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar
        value={dates}
        onChange={(e) => setDates(e.value)}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
        placeholder="Select date range"
        className="w-full sm:w-64"
        inputClassName="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
      />
      <button
        type="button"
        disabled={!dates || !dates[0] || !dates[1]}
        onClick={handleApply}
        className="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
      >
        Apply range
      </button>
    </div>
  );
}