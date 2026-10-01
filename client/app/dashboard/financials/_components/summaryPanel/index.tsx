'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { getFinancialSummary } from '@/services/financialService';
import {
  chooseUnitForRange,
  drillRangeFor,
  formatBucketLabel,
  isPartialWeek,
  unitForLevel,
  type DrillLevel,
} from './dateHelpers';
import DateRangePicker from './dateRangePicker';
import DayDetailsPanel from './dayDetailsPanel';
import type { FinancialBucket } from 'shared';

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

  const [buckets, setBuckets] = useState<FinancialBucket[]>([]);
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

        let fetchedBuckets = res.data;

        // FIX: Bulletproof String-Based Overlap Filter (Timezone Safe)
        if (current.startDate) {
          const startLimit = current.startDate.slice(0, 10);
          fetchedBuckets = fetchedBuckets.filter(
            (b) => b.endDate.slice(0, 10) > startLimit,
          );
        }
        if (current.endDate) {
          const endLimit = current.endDate.slice(0, 10);
          fetchedBuckets = fetchedBuckets.filter(
            (b) => b.startDate.slice(0, 10) < endLimit,
          );
        }

        setBuckets(fetchedBuckets);
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

    const { startDate, endDate, nextLevel } = drillRangeFor(
      current.level,
      b.startDate,
    );
    if (!nextLevel) return;

    // FIX: Bulletproof String-Based Clamping
    let clampedStart = startDate.slice(0, 10);
    let clampedEnd = endDate.slice(0, 10);

    if (current.startDate) {
      const vStart = current.startDate.slice(0, 10);
      if (clampedStart < vStart) clampedStart = vStart;
    }
    if (current.endDate) {
      const vEnd = current.endDate.slice(0, 10);
      if (clampedEnd > vEnd) clampedEnd = vEnd;
    }

    setCrumbs((prev) => [
      ...prev,
      {
        level: nextLevel,
        label: formatBucketLabel(
          current.level,
          clampedStart,
          current.startDate,
        ),
        startDate: clampedStart,
        endDate: clampedEnd,
      },
    ]);
  }

  function handleCrumbClick(index: number) {
    setCrumbs((prev) => prev.slice(0, index + 1));
  }

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
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totalIn)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Out</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totalOut)}
            </p>
          </div>
        </div>

        <DateRangePicker onApply={handleApplyRange} />
      </div>

      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Viewing: {current.label}
        </h3>
        <nav className="flex items-center gap-1 text-xs text-gray-500 flex-wrap mt-1">
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
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading chart...</p>
      ) : buckets.length === 0 ? (
        <p className="text-sm text-gray-400">No data for this period.</p>
      ) : (
        <div className="flex items-end gap-3 h-40 overflow-x-auto pb-2">
          {buckets.map((b, i) => {
            const inHeight =
              Number(b.totalIn) > 0
                ? Math.max(4, (Number(b.totalIn) / maxValue) * 100)
                : 0;
            const outHeight =
              Number(b.totalOut) > 0
                ? Math.max(4, (Number(b.totalOut) / maxValue) * 100)
                : 0;
            const partial =
              current.level === 'week' && current.startDate
                ? isPartialWeek(b.startDate, b.endDate, current.startDate)
                : false;

            // FIX: String-based tooltip clamping
            let clampedEndStr = b.endDate.slice(0, 10);
            if (
              current.endDate &&
              clampedEndStr > current.endDate.slice(0, 10)
            ) {
              clampedEndStr = current.endDate.slice(0, 10);
            }
            const displayEndDate = new Date(`${clampedEndStr}T00:00:00Z`);
            displayEndDate.setUTCDate(displayEndDate.getUTCDate() - 1);
            const formattedTooltipEnd = displayEndDate.toLocaleDateString(
              undefined,
              { month: 'short', day: 'numeric', timeZone: 'UTC' },
            );

            return (
              <div
                key={`${b.startDate}-${i}`}
                className="flex flex-col items-center gap-1 min-w-14"
              >
                <button
                  type="button"
                  onClick={() => handleBarClick(b)}
                  className="flex items-end gap-1 h-32 cursor-pointer group"
                  title="Click to see more"
                >
                  <div
                    className="w-4 border-2 border-indigo-500 bg-transparent group-hover:bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${inHeight}%` }}
                  />
                  <div
                    className="w-4 border-2 border-red-500 bg-transparent group-hover:bg-red-500 rounded-t transition-all"
                    style={{ height: `${outHeight}%` }}
                  />
                </button>

                <span className="text-[10px] text-gray-600 whitespace-nowrap text-center flex items-center justify-center gap-1">
                  {formatBucketLabel(
                    current.level,
                    b.startDate,
                    current.startDate,
                  )}
                  {partial && (
                    <span
                      title={`${formatBucketLabel(current.level, b.startDate, current.startDate)} - ${formattedTooltipEnd}`}
                      className="text-amber-500 text-sm leading-none cursor-help"
                    >
                      ◐
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <DayDetailsPanel
          date={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
