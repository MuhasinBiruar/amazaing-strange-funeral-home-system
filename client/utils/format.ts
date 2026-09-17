/** Renders a value as PHP currency, or an em dash when it is not a number. */
export function formatCurrency(value: unknown) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

/** Renders a date as e.g. "Sep 7, 2026", or an em dash when absent/invalid. */
export function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Capitalises the first letter of a lowercase enum value for display. */
export function titleCase(value: string) {
  if (!value) return '—';
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
