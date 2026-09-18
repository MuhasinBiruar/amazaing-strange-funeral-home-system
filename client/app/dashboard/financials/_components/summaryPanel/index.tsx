'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import {
  getFinancialSummary,
  type FinancialSummaryBucket,
} from '@/services/financialService';
import {
  chooseUnitForRange,
  drillRangeFor,
  formatBucketLabel,
  isPartialWeek,
  unitForLevel,
  type DrillLevel,
} from './dateHelpers';
import DateRangePicker from './dateRangePicker';
import DayTransactionsPanel from './dayTransactionsPanel';

interface Crumb {
  level: DrillLevel;
  label: string;
  startDate?: string;
  endDate?: string;
}

const ROOT_CRUMB: Crumb = { level: 'year', label: 'All years' };

export default function SummaryPanel() {
  const [crumbs, setCrumbs] = useState<Crumb[]>([ROOT_CRUMB]);
  const current = crumbs[crumbs.length - 1];

  const [buckets, setBuckets] = useState<FinancialSummaryBucket[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const res = await getFinancialSummary({
          unit: unitForLevel(current.level),
          startDate: current.startDate,
          endDate: current.endDate,
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
    load();

    return () => controller.abort();
  }, [current.level, current.startDate, current.endDate]);

  const maxValue = Math.max(
    1,
    ...buckets.flatMap((b) => [Number(b.totalIn), Number(b.totalOut)]),
  );

  function handleBarClick(b: FinancialSummaryBucket) {
    if (current.level === 'day') {
      setSelectedDay(b.startDate.slice(0, 10));
      return;
    }
    const { startDate, endDate, nextLevel } = drillRangeFor(current.level, b.startDate);
    if (!nextLevel) return;
    setCrumbs((prev) => [
      ...prev,
      { level: nextLevel, label: formatBucketLabel(current.level, b.startDate), startDate, endDate },
    ]);
  }

  function handleCrumbClick(index: number) {
    setCrumbs((prev) => prev.slice(0, index + 1));
  }

  /**
   * Applying a custom range picks the granularity automatically (day/week/
   * month/year, based on span) and replaces the drill trail with a single
   * "Custom range" crumb at that level — drilling and breadcrumbs continue
   * to work normally from there.
   */
  function handleApplyRange(startDate: string, endDate: string) {
    const level = chooseUnitForRange(startDate, endDate);
    setCrumbs([
      ROOT_CRUMB,
      {
        level,
        label: `${startDate} to ${endDate}`,
        startDate,
        endDate,
      },
    ]);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-gray-500">Total In</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalIn)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Out</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOut)}</p>
          </div>
        </div>

        <DateRangePicker onApply={handleApplyRange} />
      </div>

      <nav className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleCrumbClick(i)}
              disabled={i === crumbs.length - 1}
              className={
                i === crumbs.length - 1
                  ? 'font-medium text-gray-900'
                  : 'text-indigo-600 hover:underline cursor-pointer'
              }
            >
              {c.label}
            </button>
            {i < crumbs.length - 1 && <ChevronRight size={12} />}
          </span>
        ))}
      </nav>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading chart...</p>
      ) : buckets.length === 0 ? (
        <p className="text-sm text-gray-400">No data for this period.</p>
      ) : (
        <div className="flex items-end gap-2 h-40 overflow-x-auto">
          {buckets.map((b, i) => {
            const inHeight = Number(b.totalIn) > 0 ? Math.max(4, (Number(b.totalIn) / maxValue) * 100) : 0;
            const outHeight = Number(b.totalOut) > 0 ? Math.max(4, (Number(b.totalOut) / maxValue) * 100) : 0;
            const partial =
              current.level === 'week' && current.startDate
                ? isPartialWeek(b.startDate, b.endDate, current.startDate)
                : false;

            return (
              <div key={`${b.startDate}-${i}`} className="flex flex-col items-center gap-1 min-w-14">
                <button
                  type="button"
                  onClick={() => handleBarClick(b)}
                  className="flex items-end gap-0.5 h-32 cursor-pointer"
                >
                  <div
                    className="w-3 bg-indigo-500 rounded-t hover:opacity-80 transition"
                    style={{ height: `${inHeight}%` }}
                    title={`In: ${formatCurrency(Number(b.totalIn))}`}
                  />
                  <div
                    className="w-3 bg-red-400 rounded-t hover:opacity-80 transition"
                    style={{ height: `${outHeight}%` }}
                    title={`Out: ${formatCurrency(Number(b.totalOut))}`}
                  />
                </button>
                <span className="text-[10px] text-gray-400 whitespace-nowrap text-center">
                  {formatBucketLabel(current.level, b.startDate)}
                  {partial && <span className="block text-amber-500">(partial)</span>}
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