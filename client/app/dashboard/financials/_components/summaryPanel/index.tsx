'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/format';
import {
  getFinancialSummary,
  type FinancialSummaryBucket,
} from '@/services/financialService';

type Unit = 'day' | 'week' | 'month' | 'year';

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

/**
 * Money in/out summary cards plus a simple bar chart over the selected
 * time bucket (day/week/month/year).
 *
 * @remarks
 * Renders bars with plain divs rather than a charting library — no chart
 * dependency was confirmed installed in this repo. Swap in a real chart
 * lib here if one gets added.
 */
export default function SummaryPanel() {
  const [unit, setUnit] = useState<Unit>('month');
  const [buckets, setBuckets] = useState<FinancialSummaryBucket[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const res = await getFinancialSummary({
          unit,
          signal: controller.signal,
        });
        setBuckets(res.data);
        setTotalIn(res.meta.totalIn);
        setTotalOut(res.meta.totalOut);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load financial summary:', error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [unit]);

const maxValue = Math.max(
  1,
  ...buckets.flatMap((b) => [Number(b.totalIn), Number(b.totalOut)]),
);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-gray-500">Total collected</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totalIn)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total refunded / out</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totalOut)}
            </p>
          </div>
        </div>

        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          className="rounded-lg border border-gray-200 text-sm px-3 py-1.5 text-gray-700"
        >
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading chart...</p>
      ) : buckets.length === 0 ? (
        <p className="text-sm text-gray-400">No data for this period.</p>
      ) : (
        <div className="flex items-end gap-2 h-40 overflow-x-auto">
      {buckets.map((b, i) => {
        const inHeight = Number(b.totalIn) > 0
          ? Math.max(4, (Number(b.totalIn) / maxValue) * 100)
          : 0;
        const outHeight = Number(b.totalOut) > 0
          ? Math.max(4, (Number(b.totalOut) / maxValue) * 100)
          : 0;

        return (
          <div
            key={`${b.startDate}-${i}`}
            className="flex flex-col items-center gap-1 min-w-12"
          >
            <div className="flex items-end gap-0.5 h-32">
              <div
                className="w-3 bg-indigo-500 rounded-t"
                style={{ height: `${inHeight}%` }}
                title={`In: ${formatCurrency(Number(b.totalIn))}`}
              />
              <div
                className="w-3 bg-red-400 rounded-t"
                style={{ height: `${outHeight}%` }}
                title={`Out: ${formatCurrency(Number(b.totalOut))}`}
              />
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {new Date(b.startDate).toLocaleDateString(undefined, {
                month: 'short',
                day: unit === 'day' || unit === 'week' ? 'numeric' : undefined,
                year: unit === 'year' ? 'numeric' : undefined,
              })}
            </span>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}