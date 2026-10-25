'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DateRange,
  DateRangePicker as ReactDateRangePicker,
  defaultStaticRanges,
  type RangeKeyDict,
  type Range,
} from 'react-date-range';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import type { DateRangeValue } from '@/components/dataTable/types';

// Required CSS for react-date-range
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

/** Gap kept between the popover and the viewport edges / the button. */
const MARGIN_PX = 8;
/** `react-date-range` widths: the preset sidebar and one month. */
const PRESETS_WIDTH_PX = 226;
const MONTH_WIDTH_PX = 332;
/** The popover's own padding and border around the calendar. */
const POPOVER_CHROME_PX = 18;

type Layout = { months: 1 | 2; showPresetSidebar: boolean };

/**
 * The widest calendar that fits the viewport: two months with the preset
 * sidebar, else one month with it, else one month with presets shown as a
 * compact row of buttons instead (phones).
 */
function pickLayout(viewportWidth: number): Layout {
  const available = viewportWidth - MARGIN_PX * 2 - POPOVER_CHROME_PX;
  if (available >= PRESETS_WIDTH_PX + MONTH_WIDTH_PX * 2) {
    return { months: 2, showPresetSidebar: true };
  }
  if (available >= PRESETS_WIDTH_PX + MONTH_WIDTH_PX) {
    return { months: 1, showPresetSidebar: true };
  }
  return { months: 1, showPresetSidebar: false };
}

/**
 * The app's one date range control: a button that opens a calendar with
 * range presets. Used by the financials summary, every table's date filter,
 * and the export modal.
 *
 * @remarks
 * Uncontrolled by default (the financials summary): the button shows the
 * range last picked here. Pass `value` to make it reflect a range held
 * elsewhere (e.g. a `DataTable` filter), shown as `placeholder` when no range
 * is set, and `onClear` to offer clearing that range.
 *
 * The popover is portaled to `document.body` so scrolling containers (like
 * modals) can't clip it. It sizes itself to the viewport (see `pickLayout`)
 * and, once rendered, is measured and placed under the button, or above it
 * when there's more room there, shifted sideways to stay on screen.
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
  const [layout, setLayout] = useState<Layout>({
    months: 2,
    showPresetSidebar: true,
  });
  // `null` until the open popover has been measured and placed; it renders
  // invisibly until then so it never flashes in the wrong spot.
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [range, setRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Place the popover from its real rendered size; redo it whenever it could
  // have moved (scroll, resize) or changed size (layout).
  useLayoutEffect(() => {
    if (!isOpen) return;

    function place() {
      const button = buttonRef.current?.getBoundingClientRect();
      const popover = popoverRef.current;
      if (!button || !popover) return;

      const width = popover.offsetWidth;
      const height = popover.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Right edges aligned with the button, then nudged back on screen.
      const left = Math.min(
        Math.max(MARGIN_PX, button.right - width),
        Math.max(MARGIN_PX, viewportWidth - width - MARGIN_PX),
      );

      const spaceBelow = viewportHeight - button.bottom - MARGIN_PX * 2;
      const spaceAbove = button.top - MARGIN_PX * 2;
      let top: number;
      if (height <= spaceBelow) {
        top = button.bottom + MARGIN_PX;
      } else if (height <= spaceAbove) {
        top = button.top - MARGIN_PX - height;
      } else {
        // Fits neither way: keep it fully on screen (it scrolls inside).
        top = Math.max(MARGIN_PX, viewportHeight - height - MARGIN_PX);
      }

      setPosition({ top, left });
    }

    function handleResize() {
      setLayout(pickLayout(window.innerWidth));
      place();
    }

    place();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, layout]);

  // Close popover when clicking outside of it (and outside its button)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = Boolean(value?.from && value?.to);

  const toggleOpen = () => {
    if (!isOpen) {
      setLayout(pickLayout(window.innerWidth));
      setPosition(null);
      // When controlled, start the calendar on the range currently applied.
      if (value) {
        setRange([
          {
            startDate: value.from ? parseISO(value.from) : new Date(),
            endDate: value.to ? parseISO(value.to) : new Date(),
            key: 'selection',
          },
        ]);
      }
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

  const calendarProps = {
    ranges: range,
    onChange: (item: RangeKeyDict) => setRange([item.selection]),
    direction: 'horizontal' as const,
    months: layout.months,
    moveRangeOnFirstSelection: false,
    rangeColors: ['#4f46e5'],
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition cursor-pointer shadow-sm ${
          value && !hasValue ? 'text-gray-400' : 'text-gray-700'
        }`}
      >
        <Calendar size={16} className="shrink-0 text-gray-500" />
        <span className="truncate">{displayString}</span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choose a date range"
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="fixed z-60 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl"
          >
            {layout.showPresetSidebar ? (
              <ReactDateRangePicker {...calendarProps} />
            ) : (
              <>
                {/* The 226px preset sidebar doesn't fit on phones, so the
                    same presets are offered as wrapping buttons instead. */}
                <div className="flex flex-wrap gap-1.5 px-2 pt-1 pb-2">
                  {defaultStaticRanges.map((preset) => {
                    const isSelected = preset.isSelected(range[0]);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setRange([{ ...preset.range(), key: 'selection' }])
                        }
                        aria-pressed={isSelected}
                        className={`rounded-full border px-2.5 py-1 text-xs transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <DateRange {...calendarProps} />
              </>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3 px-2 pb-1">
              {onClear && hasValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="mr-auto px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
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
          </div>,
          document.body,
        )}
    </>
  );
}
