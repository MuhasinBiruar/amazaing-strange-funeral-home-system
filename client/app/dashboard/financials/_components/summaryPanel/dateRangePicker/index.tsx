'use client';

import { useState, useRef, useEffect } from 'react';
import { DateRangePicker as ReactDateRangePicker, type RangeKeyDict, type Range } from 'react-date-range';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

// Required CSS for react-date-range
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function DateRangePicker({
  onApply,
}: {
  onApply: (startDate: string, endDate: string) => void;
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
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    const start = range[0].startDate;
    const end = range[0].endDate;
    
    if (start && end) {
      onApply(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const displayString = range[0].startDate && range[0].endDate
    ? `${format(range[0].startDate, 'MMM d, yyyy')} - ${format(range[0].endDate, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-sm"
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