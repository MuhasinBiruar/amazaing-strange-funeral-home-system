'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DateRangePicker as ReactDateRangePicker,
  type RangeKeyDict,
  type Range,
} from 'react-date-range';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import type { DateRangeValue } from '@/components/dataTable/types';

// Required CSS for react-date-range
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

/**
 * Button that opens a two-month calendar with range presets.
 *
 * @remarks
 * Uncontrolled by default (the financials summary): the button shows the
 * range last picked here. Pass `value` to make it reflect a range held
 * elsewhere (e.g. a `DataTable` filter), shown as `placeholder` when no range
 * is set, and `onClear` to offer clearing that range.
 */
export default function DateRangePicker({
  onApply,
  value,
  placeholder = 'Select date range',
  onClear,
}: {
  onApply: (startDate: string, endDate: string) => void;
  /** `yyyy-mm-dd` range to display; omit to keep the picker uncontrolled. */
  value?: DateRangeValue;
  placeholder?: string;
  onClear?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = Boolean(value?.from && value?.to);

  const toggleOpen = () => {
    // When controlled, start the calendar on the range currently applied.
    if (!isOpen && value) {
      setRange([
        {
          startDate: value.from ? parseISO(value.from) : new Date(),
          endDate: value.to ? parseISO(value.to) : new Date(),
          key: 'selection',
        },
      ]);
    }
    setIsOpen(!isOpen);
  };

  const handleApply = () => {
    const start = range[0].startDate;
    const end = range[0].endDate;

    if (start && end) {
      onApply(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setIsOpen(false);
  };

  let displayString: string;
  if (value) {
    displayString = hasValue
      ? `${format(parseISO(value.from!), 'MMM d, yyyy')} - ${format(parseISO(value.to!), 'MMM d, yyyy')}`
      : placeholder;
  } else {
    displayString =
      range[0].startDate && range[0].endDate
        ? `${format(range[0].startDate, 'MMM d, yyyy')} - ${format(range[0].endDate, 'MMM d, yyyy')}`
        : placeholder;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition cursor-pointer shadow-sm ${
          value && !hasValue ? 'text-gray-400' : 'text-gray-700'
        }`}
      >
        <Calendar size={16} className="text-gray-500" />
        {displayString}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl"
        >
          <ReactDateRangePicker
            ranges={range}
            onChange={(item: RangeKeyDict) => setRange([item.selection])}
            direction="horizontal"
            months={2}
            moveRangeOnFirstSelection={false}
            rangeColors={['#4f46e5']}
          />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 pr-4">
            {onClear && hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="mr-auto ml-4 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition cursor-pointer shadow-sm"
            >
              Apply range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
