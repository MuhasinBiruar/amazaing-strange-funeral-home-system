/** One read-only label/value pair in the panel's deceased-details list. */
export default function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
      <dd className="text-xs text-gray-700 text-right wrap-break-word">
        {value || '—'}
      </dd>
    </div>
  );
}
