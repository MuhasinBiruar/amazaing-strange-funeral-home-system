import type { DateUnit } from 'shared/utils';

/**
 * Returns a representation of the start of the given day.
 */
export function getStartOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Truncates a date to the start of the given unit (day, week, month, year).
 */
export function truncToUnit(d: Date, unit: DateUnit) {
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

export function addDaysUTC(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export function addUnits(d: Date, unit: DateUnit, n: number) {
  switch (unit) {
    case 'day':
      return addDaysUTC(d, n);
    case 'week':
      return addDaysUTC(d, n * 7);
    case 'month': {
      const result = new Date(d);
      // Temporarily set to day 1 to avoid overflow issues during calculation
      // This is due to months having different number of days
      result.setUTCDate(1);
      result.setUTCMonth(result.getUTCMonth() + n);

      // Clamp the day to the maximum available days in the target month
      const maxDaysInMonth = new Date(
        Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
      ).getUTCDate();
      result.setUTCDate(Math.min(d.getUTCDate(), maxDaysInMonth));
      return result;
    }
    case 'year': {
      const result = new Date(d);
      // Temporarily set to day 1 to avoid overflow issues during calculation
      // This is due to leap years
      result.setUTCDate(1);
      result.setUTCMonth(d.getUTCMonth());
      result.setUTCFullYear(result.getUTCFullYear() + n);

      // Clamp the day to the maximum available days in the target month
      const maxDaysInMonth = new Date(
        Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
      ).getUTCDate();
      result.setUTCDate(Math.min(d.getUTCDate(), maxDaysInMonth));
      return result;
    }
  }
}

export function calcUnitsBetween(from: Date, to: Date, unit: DateUnit) {
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
export function toExclusiveEndBound(dateStr: string): Date {
  const hasTime = dateStr.includes(':') || /T\d{2}/.test(dateStr);
  if (!hasTime) return new Date(dateStr);

  return addDaysUTC(new Date(dateStr), 1);
}
