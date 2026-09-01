import type { FinancialUnit, FinancialBucket } from 'shared';

/**
 * Returns a representation of the start of the given day.
 */
function getStartOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Truncates a date to the start of the given unit (day, week, month, year).
 */
function truncToUnit(d: Date, unit: FinancialUnit) {
  switch (unit) {
    case 'day':
      return getStartOfDayUTC(d);
    case 'week': {
      const day = getStartOfDayUTC(d);
      // 0 = Sun ... 6 = Sat
      const dayOfTheWeek = day.getUTCDay();
      const daysSinceMonday = (dayOfTheWeek + 6) % 7;
      day.setUTCDate(day.getUTCDate() - daysSinceMonday);
      return day;
    }
    case 'month':
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    case 'year':
      return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  }
}

function addDaysUTC(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function addUnits(d: Date, unit: FinancialUnit, n: number) {
  switch (unit) {
    case 'day':
      return addDaysUTC(d, n);
    case 'week':
      return addDaysUTC(d, n * 7);
    case 'month':
      return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()),
      );
    case 'year':
      return new Date(
        Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()),
      );
  }
}

function calcUnitsBetween(from: Date, to: Date, unit: FinancialUnit) {
  switch (unit) {
    case 'day':
      return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
    case 'week':
      return Math.floor((to.getTime() - from.getTime()) / (86_400_000 * 7));
    case 'month':
      return (
        (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
        (to.getUTCMonth() - from.getUTCMonth())
      );
    case 'year':
      return to.getUTCFullYear() - from.getUTCFullYear();
  }
}

/**
 * Date-only end dates are moved to the next day so they include the entire
 * final day.
 */
export function toExclusiveEndBound(date: Date): Date {
  const isMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (!isMidnight) return date;

  return addDaysUTC(date, 1);
}

interface PeriodRow {
  period: Date | string;
  totalout: string | number | null;
  totalin: string | number | null;
  transactioncount: string | number;
}

function buildEmptyBuckets(
  start: Date,
  unit: FinancialUnit,
  interval: number,
  maxBucketIndex: number,
): FinancialBucket[] {
  const buckets: FinancialBucket[] = [];
  for (let i = 0; i <= maxBucketIndex; i++) {
    const periodStart = addUnits(start, unit, i * interval);
    const periodEnd = addUnits(periodStart, unit, interval);
    buckets.push({
      periodStart,
      periodEnd,
      totalIn: 0,
      totalOut: 0,
      transactionCount: 0,
    });
  }
  return buckets;
}

/**
 * Folds per-period aggregates (e.g. day, week, etc.) into buckets of
 * `interval` * `unit` (e.g. every 3 days, every 2 months, every 5
 * years).
 */
export function foldPeriods(
  periods: PeriodRow[],
  unit: FinancialUnit,
  interval: number,
  startDate: Date | null,
  endDate: Date | null,
) {
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

  let totalIn = 0;
  let totalOut = 0;
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const diff = calcUnitsBetween(start, periodDates[i], unit);
    const bucketIndex = Math.floor(diff / interval);

    console.log(start, periodDates[i], diff, bucketIndex);
    const bucket = buckets[bucketIndex];
    const rowIn = Number(period.totalin ?? 0);
    const rowOut = Number(period.totalout ?? 0);

    bucket.totalIn += rowIn;
    bucket.totalOut += rowOut;
    bucket.transactionCount += Number(period.transactioncount);

    totalIn += rowIn;
    totalOut += rowOut;
  }

  return { buckets, totalIn, totalOut };
}
