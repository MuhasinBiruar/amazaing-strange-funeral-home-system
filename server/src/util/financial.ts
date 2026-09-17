import BigNumber from 'bignumber.js';
import type { DateUnit } from 'shared';
import { z } from 'zod';
import { addUnits, calcUnitsBetween, truncToUnit } from './date';

function buildEmptyBuckets(
  start: Date,
  unit: DateUnit,
  interval: number,
  maxBucketIndex: number,
) {
  const buckets = [];
  for (let i = 0; i <= maxBucketIndex; i++) {
    const startDate = addUnits(start, unit, i * interval);
    const endDate = addUnits(startDate, unit, interval);
    buckets.push({
      startDate,
      endDate,
      totalIn: BigNumber(0),
      totalOut: BigNumber(0),
      transactionCount: 0,
    });
  }
  return buckets;
}

const InternalGetBucketsQuerySchema = z.array(
  z.object({
    period: z.coerce.date(),
    totalout: z.string().transform((s) => new BigNumber(s)),
    totalin: z.string().transform((s) => new BigNumber(s)),
    transactioncount: z.coerce.bigint(),
  }),
);

/**
 * Folds per-period aggregates (e.g. day, week, etc.) into buckets of
 * `interval` * `unit` (e.g. every 3 days, every 2 months, every 5
 * years).
 */
export function foldPeriods(
  rows: unknown[],
  unit: DateUnit,
  interval: number,
  startDate: Date | null,
  endDate: Date | null,
) {
  const periods = InternalGetBucketsQuerySchema.parse(rows);

  const periodDates = periods.map((p) => new Date(p.period));
  const oldestPeriodDate = periodDates.length
    ? periodDates.reduce((min, d) => (d < min ? d : min), periodDates[0])
    : null;
  const newestPeriodDate = periodDates.length
    ? periodDates.reduce((max, d) => (d > max ? d : max), periodDates[0])
    : null;

  const startRaw = startDate ?? oldestPeriodDate ?? endDate;
  if (!startRaw) return { buckets: [], totalIn: 0, totalOut: 0 };
  const start = truncToUnit(startRaw, unit);

  const endCandidates = [
    endDate ? truncToUnit(endDate, unit) : null,
    newestPeriodDate ? truncToUnit(newestPeriodDate, unit) : null,
  ].filter((d): d is Date => d !== null);
  const end =
    endCandidates.length !== 0
      ? new Date(Math.max(...endCandidates.map((d) => d.getTime())))
      : start;

  const maxBucketIndex = Math.max(
    0,
    Math.floor(calcUnitsBetween(start, end, unit) / interval),
  );

  const buckets = buildEmptyBuckets(start, unit, interval, maxBucketIndex);

  let totalIn = new BigNumber(0);
  let totalOut = new BigNumber(0);
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const diff = calcUnitsBetween(start, periodDates[i], unit);
    const bucketIndex = Math.floor(diff / interval);

    const bucket = buckets[bucketIndex];

    const rowIn = BigNumber(period.totalin ?? 0);
    const rowOut = BigNumber(period.totalout ?? 0);

    bucket.totalIn = bucket.totalIn.plus(rowIn);
    bucket.totalOut = bucket.totalOut.plus(rowOut);
    bucket.transactionCount += Number(period.transactioncount);

    totalIn = totalIn.plus(rowIn);
    totalOut = totalOut.plus(rowOut);
  }

  return { buckets, totalIn, totalOut };
}
