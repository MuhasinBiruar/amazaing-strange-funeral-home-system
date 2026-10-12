import type { DateUnit } from 'shared/utils';

/** Formats date to a `yyyy-MM-dd` string. */
export function toIsoDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Range for the "children" of a clicked bucket at the current level. */
export function drillRangeFor(level: DateUnit, bucketStart: Date) {
  const y = bucketStart.getUTCFullYear();
  const m = bucketStart.getUTCMonth();

  if (level === 'year') {
    return {
      startDate: bucketStart,
      endDate: new Date(Date.UTC(y + 1, 0, 1)),
      nextLevel: 'month' as DateUnit,
    };
  }

  if (level === 'month') {
    return {
      startDate: bucketStart,
      endDate: new Date(Date.UTC(y, m + 1, 1)),
      nextLevel: 'week' as DateUnit,
    };
  }

  if (level === 'week') {
    const end = new Date(bucketStart);
    end.setUTCDate(end.getUTCDate() + 7);
    return {
      startDate: bucketStart,
      endDate: end,
      nextLevel: 'day' as DateUnit,
    };
  }

  // day has no further drill-down
  return { startDate: bucketStart, endDate: bucketStart, nextLevel: null };
}

/**
 * True if this week bucket's days don't all fall within `monthStart`'s
 * calendar month, i.e. it straddles a month boundary.
 */
export function isPartialWeek(
  weekStart: Date,
  weekEnd: Date, // exclusive
  monthStart: Date,
) {
  const monthIndex = monthStart.getUTCMonth();
  const year = monthStart.getUTCFullYear();

  const lastDay = new Date(weekEnd);
  lastDay.setUTCDate(lastDay.getUTCDate() - 1);

  const startsInMonth =
    weekStart.getUTCMonth() === monthIndex &&
    weekStart.getUTCFullYear() === year;
  const endsInMonth =
    lastDay.getUTCMonth() === monthIndex && lastDay.getUTCFullYear() === year;

  return !(startsInMonth && endsInMonth);
}

export function formatBucketLabel(
  level: DateUnit,
  startDate: Date,
  viewStartDate?: Date,
) {
  // Clamp a week that begins before the visible range.
  const d =
    level === 'week' && viewStartDate && startDate < viewStartDate
      ? viewStartDate
      : startDate;

  if (level === 'year')
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      timeZone: 'UTC',
    });
  if (level === 'month')
    return d.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function chooseUnitForRange(startDate: Date, endDate: Date): DateUnit {
  const spanDays = (endDate.getTime() - startDate.getTime()) / 86_400_000;

  if (spanDays <= 7) return 'day';
  if (spanDays <= 31) return 'week';
  if (spanDays <= 366) return 'month';
  return 'year';
}
