import BigNumber from 'bignumber.js';
import type { DateUnit } from 'shared/utils';
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

export const GetBucketsQuerySchema = z.array(
  z.object({
    /**
     * If unit is day, this will be the day at `00:00:00.000Z`.
     * If unit is month, this will be the first day of the month at `00:00:00.000Z`.
     * If unit is year, this will be the first day of the year at `00:00:00.000Z`.
     */
    period: z.coerce.date(),
    totalout: z.string().transform((s) => new BigNumber(s)),
    totalin: z.string().transform((s) => new BigNumber(s)),
    transactioncount: z.coerce.bigint(),
  }),
);

export type GetBucketsQuery = z.infer<typeof GetBucketsQuerySchema>;

/**
 * Folds per-period aggregates (e.g. day, week, etc.) into buckets of
 * `interval` * `unit` (e.g. every 3 days, every 2 months, every 5
 * years).
 */
export function foldPeriods(
  rows: GetBucketsQuery,
  unit: DateUnit,
  interval: number,
  startDate: Date | null,
  endDate: Date | null,
) {
  const periodDates = rows.map((p) => new Date(p.period));
  const oldestPeriodDate = periodDates.length
    ? periodDates.reduce((min, d) => (d < min ? d : min), periodDates[0])
    : null;
  const newestPeriodDate = periodDates.length
    ? periodDates.reduce((max, d) => (d > max ? d : max), periodDates[0])
    : null;

  // Without an explicit start, begin at the oldest period in the data. If
  // there is no data either, there is nothing to bucket.
  const startRaw = startDate ?? oldestPeriodDate;
  if (!startRaw)
    return {
      buckets: [],
      totalIn: new BigNumber(0),
      totalOut: new BigNumber(0),
    };
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
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const diff = calcUnitsBetween(start, periodDates[i], unit);
    const bucketIndex = Math.floor(diff / interval);

    const bucket = buckets[bucketIndex];

    const rowIn = BigNumber(row.totalin ?? 0);
    const rowOut = BigNumber(row.totalout ?? 0);

    bucket.totalIn = bucket.totalIn.plus(rowIn);
    bucket.totalOut = bucket.totalOut.plus(rowOut);
    bucket.transactionCount += Number(row.transactioncount);

    totalIn = totalIn.plus(rowIn);
    totalOut = totalOut.plus(rowOut);
  }

  return { buckets, totalIn, totalOut };
}
