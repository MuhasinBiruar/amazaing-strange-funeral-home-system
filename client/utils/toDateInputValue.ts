/**
 * `<input type="date">` wants `yyyy-mm-dd` in the viewer's local time.
 */
export function toDateInputValue(date: Date | string | null): string {
  if (!date) return '';

  const d =
    typeof date === 'string' || date instanceof String ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}
