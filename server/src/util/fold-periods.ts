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

interface PeriodRow {
  period: Date | string;
  totalout: string | number | null;
  totalin: string | number | null;
  transactioncount: string | number;
}

/**
 * Folds per-period aggregates (e.g. day, week, etc.) into buckets of
 * `interval` * `unit` (e.g. every 3 days, every 2 months, every 5
 * years).
 */
export default function foldPeriods(
  periods: PeriodRow[],
  unit: FinancialUnit,
  interval: number,
  startDate: Date | null,
) {
  if (periods.length === 0)
    return {
      buckets: [],
      totalIn: 0,
      totalOut: 0,
    };

  const periodDates = periods.map((p) => new Date(p.period));

  if (!startDate)
    startDate = periodDates.reduce(
      (min, d) => (d < min ? d : min),
      periodDates[0],
    );
  startDate = truncToUnit(startDate, unit);

  // Fold per-period aggregates into corresponding interval buckets
  const bucketMap = new Map<number, FinancialBucket>();
  let totalIn = 0;
  let totalOut = 0;

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const diff = calcUnitsBetween(startDate, periodDates[i], unit);
    const bucketIndex = Math.floor(diff / interval);

    let bucket = bucketMap.get(bucketIndex);
    if (!bucket) {
      const periodStart = addUnits(startDate, unit, bucketIndex * interval);
      const periodEnd = addUnits(periodStart, unit, interval);
      bucket = {
        periodStart,
        periodEnd,
        totalIn: 0,
        totalOut: 0,
        transactionCount: 0,
      };
      bucketMap.set(bucketIndex, bucket);
    }

    const rowIn = Number(period.totalin ?? 0);
    const rowOut = Number(period.totalout ?? 0);

    bucket.totalIn += rowIn;
    bucket.totalOut += rowOut;
    bucket.transactionCount += Number(period.transactioncount);

    totalIn += rowIn;
    totalOut += rowOut;
  }

  // Fill in empty buckets with zeroes (for charting)
  const maxBucketIndex = Math.floor(
    calcUnitsBetween(
      startDate,
      periodDates.reduce((max, d) => (d > max ? d : max), periodDates[0]),
      unit,
    ) / interval,
  );

  const buckets: FinancialBucket[] = [];
  for (let i = 0; i <= maxBucketIndex; i++) {
    const existing = bucketMap.get(i);
    if (existing) {
      buckets.push(existing);
      continue;
    }

    const periodStart = addUnits(startDate, unit, i * interval);
    const periodEnd = addUnits(periodStart, unit, interval);
    buckets.push({
      periodStart,
      periodEnd,
      totalIn: 0,
      totalOut: 0,
      transactionCount: 0,
    });
  }

  return { buckets, totalIn, totalOut };
}
