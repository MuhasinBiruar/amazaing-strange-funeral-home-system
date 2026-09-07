import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortOrder = 'asc' | 'desc';

export interface SortableColumn<K extends string> {
  key: K;
  label: string;
}

/**
 * A `<th>` that toggles sorting for its column.
 *
 * Generic over the column key so it can back any table whose sortable keys are
 * derived from a shared zod schema (`keyof Case`, `keyof UncontractedDeceased`,
 * and so on).
 */
export default function SortableHeaderCell<K extends string>({
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: SortableColumn<K>;
  sortBy: K;
  sortOrder: SortOrder;
  onSort: (columnKey: K) => void;
}) {
  const isActive = sortBy === column.key;

  return (
    <th className="px-5 py-2.5 font-medium text-center h-2">
      <button
        onClick={() => onSort(column.key)}
        className={`w-full h-full flex items-center justify-center gap-1 cursor-pointer select-none hover:text-indigo-700 ${
          isActive ? 'text-indigo-700' : 'text-gray-400'
        } uppercase`}
      >
        {column.label}
        {isActive ? (
          sortOrder === 'asc' ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )
        ) : (
          <ChevronsUpDown size={13} className="text-gray-300" />
        )}
      </button>
    </th>
  );
}
