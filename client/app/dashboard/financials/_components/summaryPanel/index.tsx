'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import {
  getFinancialSummary,
  type FinancialSummaryBucket,
} from '@/services/financialService';
import {
  chooseUnitForRange,
  formatBucketLabel,
  isPartialWeek,
  type DrillLevel,
} from './dateHelpers';
import DateRangePicker from './dateRangePicker';
import DayTransactionsPanel from './dayTransactionsPanel';

type ViewMode = 'calendar' | 'range';
type BarUnit = 'day' | 'week' | 'month' | 'year';

export default function SummaryPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [barUnit, setBarUnit] = useState<BarUnit>('month');
  const [activeDate, setActiveDate] = useState<Date>(() => new Date());

  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [buckets, setBuckets] = useState<FinancialSummaryBucket[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Calculate the exact boundaries of the currently selected period
  let startDateStr = '';
  let endDateStr = '';

  if (viewMode === 'range' && customRange) {
    startDateStr = customRange.startDate;
    endDateStr = customRange.endDate;
  } else if (barUnit === 'day') {
    const y = activeDate.getUTCFullYear();
    const m = activeDate.getUTCMonth();
    const d = activeDate.getUTCDate();
    const dayOfWeek = activeDate.getUTCDay(); 
    const start = new Date(Date.UTC(y, m, d - dayOfWeek));
    const end = new Date(Date.UTC(y, m, d - dayOfWeek + 6));
    startDateStr = start.toISOString().slice(0, 10);
    endDateStr = end.toISOString().slice(0, 10);
  } else if (barUnit === 'week') {
    const y = activeDate.getUTCFullYear();
    const m = activeDate.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    startDateStr = start.toISOString().slice(0, 10);
    endDateStr = end.toISOString().slice(0, 10);
  } else if (barUnit === 'month') {
    const y = activeDate.getUTCFullYear();
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y, 11, 31));
    startDateStr = start.toISOString().slice(0, 10);
    endDateStr = end.toISOString().slice(0, 10);
  } else if (barUnit === 'year') {
    const y = activeDate.getUTCFullYear();
    const startYear = Math.floor(y / 10) * 10;
    const start = new Date(Date.UTC(startYear, 0, 1));
    const end = new Date(Date.UTC(startYear + 9, 11, 31));
    startDateStr = start.toISOString().slice(0, 10);
    endDateStr = end.toISOString().slice(0, 10);
  }

  // Determine the true unit of the bars currently being displayed
  const activeUnit = viewMode === 'range' 
    ? chooseUnitForRange(startDateStr, endDateStr) 
    : barUnit;

  // 2. Fetch the data whenever the date bounds or unit changes
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const res = await getFinancialSummary({
          unit: activeUnit,
          startDate: startDateStr,
          endDate: endDateStr,
          signal: controller.signal,
        });
        setBuckets(res.data);
        setTotalIn(Number(res.meta.totalIn));
        setTotalOut(Number(res.meta.totalOut));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load financial summary:', error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    if (startDateStr && endDateStr) {
      load();
    }

    return () => controller.abort();
  }, [viewMode, activeUnit, activeDate, customRange, startDateStr, endDateStr]);

  // 3. Arrow button stepping logic
  function stepPeriod(delta: number) {
    setActiveDate((prev) => {
      const d = new Date(prev);
      if (barUnit === 'day') d.setUTCDate(d.getUTCDate() + (delta * 7));
      else if (barUnit === 'week') d.setUTCMonth(d.getUTCMonth() + delta);
      else if (barUnit === 'month') d.setUTCFullYear(d.getUTCFullYear() + delta);
      else if (barUnit === 'year') d.setUTCFullYear(d.getUTCFullYear() + (delta * 10));
      return d;
    });
  }

  // 4. Hierarchical Bar Drill-down logic
  function handleBarClick(b: FinancialSummaryBucket) {
    // Parse the clicked date safely
    const [y, m, d] = b.startDate.toString().slice(0, 10).split('-');
    const clickedDate = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));

    // Drill down based on the actual unit being displayed, even if it came from Custom Range
    if (activeUnit === 'year') {
      setViewMode('calendar');
      setActiveDate(clickedDate);
      setBarUnit('month'); 
    } else if (activeUnit === 'month') {
      setViewMode('calendar');
      setActiveDate(clickedDate);
      setBarUnit('week');
    } else if (activeUnit === 'week') {
      setViewMode('calendar');
      setActiveDate(clickedDate);
      setBarUnit('day');
    } else if (activeUnit === 'day') {
      // Only open the day panel if the bar represents a single day
      setSelectedDay(b.startDate.toString().slice(0, 10)); 
    }
  }

  const maxValue = Math.max(1, ...buckets.flatMap((b) => [Number(b.totalIn), Number(b.totalOut)]));

  // 5. Formatted Titles for the active period
  let formattedPeriodTitle = '';
  if (barUnit === 'day') {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    formattedPeriodTitle = `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}, ${start.getUTCFullYear()}`;
  } else if (barUnit === 'week') {
    formattedPeriodTitle = activeDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } else if (barUnit === 'month') {
    formattedPeriodTitle = activeDate.toLocaleDateString(undefined, { year: 'numeric', timeZone: 'UTC' });
  } else if (barUnit === 'year') {
    const startYear = Math.floor(activeDate.getUTCFullYear() / 10) * 10;
    formattedPeriodTitle = `${startYear} - ${startYear + 9}`;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-gray-500">Total In</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalIn)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Out</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalOut)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`rounded-md px-3 py-1.5 transition cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Calendar View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('range')}
              className={`rounded-md px-3 py-1.5 transition cursor-pointer ${
                viewMode === 'range' ? 'bg-white shadow-sm text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Custom Range
            </button>
          </div>

          {viewMode === 'calendar' ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
                {(['day', 'week', 'month', 'year'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setBarUnit(unit)}
                    className={`rounded-md px-2.5 py-1.5 transition cursor-pointer ${
                      barUnit === unit ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    By {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => stepPeriod(-1)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-gray-700 px-3 min-w-[150px] text-center">
                  {formattedPeriodTitle}
                </span>
                <button
                  type="button"
                  onClick={() => stepPeriod(1)}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <DateRangePicker onApply={(start, end) => setCustomRange({ startDate: start, endDate: end })} />
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading chart...</p>
      ) : buckets.length === 0 ? (
        <p className="text-sm text-gray-400">No transactions found for this timeframe.</p>
      ) : (
        <div className="flex items-end gap-2 h-44 overflow-x-auto pt-4 border-t border-gray-100">
          {buckets.map((b, i) => {
            const inHeight = Number(b.totalIn) > 0 ? Math.max(6, (Number(b.totalIn) / maxValue) * 100) : 0;
            const outHeight = Number(b.totalOut) > 0 ? Math.max(6, (Number(b.totalOut) / maxValue) * 100) : 0;
            const dayKey = b.startDate.toString().slice(0, 10);
            
            // Check for partial weeks
            const isPartial = activeUnit === 'week' && startDateStr
              ? isPartialWeek(b.startDate.toString(), b.endDate?.toString() || b.startDate.toString(), startDateStr)
              : false;

            return (
              <div key={`${dayKey}-${i}`} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                <button
                  type="button"
                  onClick={() => handleBarClick(b)}
                  className="flex items-end gap-1 h-32 cursor-pointer group"
                >
                  <div
                    className="w-3.5 bg-indigo-500 rounded-t group-hover:bg-indigo-600 transition"
                    style={{ height: `${inHeight}%` }}
                    title={`In: ${formatCurrency(Number(b.totalIn))}`}
                  />
                  <div
                    className="w-3.5 bg-red-400 rounded-t group-hover:bg-red-500 transition"
                    style={{ height: `${outHeight}%` }}
                    title={`Out: ${formatCurrency(Number(b.totalOut))}`}
                  />
                </button>
                <span className="text-[10px] text-gray-400 whitespace-nowrap text-center">
                  {formatBucketLabel(activeUnit as DrillLevel, b.startDate.toString())}
                  {isPartial && <span className="block text-amber-500">(partial)</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <DayTransactionsPanel date={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}