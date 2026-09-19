export type DrillLevel = 'year' | 'month' | 'week' | 'day';

const LEVEL_UNIT: Record<DrillLevel, 'year' | 'month' | 'week' | 'day'> = {
  year: 'year',
  month: 'month',
  week: 'week',
  day: 'day',
};

export function unitForLevel(level: DrillLevel) {
  return LEVEL_UNIT[level];
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Range for the "children" of a clicked bucket at the current level. */
export function drillRangeFor(level: DrillLevel, bucketStartDate: string) {
  const start = new Date(bucketStartDate);

  if (level === 'year') {
    const end = new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
    return { startDate: toIsoDate(start), endDate: toIsoDate(end), nextLevel: 'month' as DrillLevel };
  }

  if (level === 'month') {
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { startDate: toIsoDate(start), endDate: toIsoDate(end), nextLevel: 'week' as DrillLevel };
  }

  if (level === 'week') {
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { startDate: toIsoDate(start), endDate: toIsoDate(end), nextLevel: 'day' as DrillLevel };
  }

  // day has no further drill-down
  return { startDate: toIsoDate(start), endDate: toIsoDate(start), nextLevel: null };
}

/**
 * True if this week bucket's days don't all fall within `monthStart`'s
 * calendar month — i.e. it straddles a month boundary.
 */
export function isPartialWeek(
  weekStartDate: string,
  weekEndDate: string,
  monthStart: string,
) {
  const monthDate = new Date(monthStart);
  const monthIndex = monthDate.getUTCMonth();
  const year = monthDate.getUTCFullYear();

  const wStart = new Date(weekStartDate);
  const wEnd = new Date(weekEndDate);
  wEnd.setUTCDate(wEnd.getUTCDate() - 1); // endDate is exclusive

  const startsInMonth =
    wStart.getUTCMonth() === monthIndex && wStart.getUTCFullYear() === year;
  const endsInMonth =
    wEnd.getUTCMonth() === monthIndex && wEnd.getUTCFullYear() === year;

  return !(startsInMonth && endsInMonth);
}

export function formatBucketLabel(level: DrillLevel, startDate: string) {
  const d = new Date(startDate);
  if (level === 'year') return d.toLocaleDateString(undefined, { year: 'numeric' });
  if (level === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  if (level === 'week') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function chooseUnitForRange(startDate: string, endDate: string): DrillLevel {
  const spanDays =
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000;

  if (spanDays <= 7) return 'day';
  if (spanDays <= 31) return 'week';
  if (spanDays <= 366) return 'month';
  return 'year';
}

export function toIsoDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}