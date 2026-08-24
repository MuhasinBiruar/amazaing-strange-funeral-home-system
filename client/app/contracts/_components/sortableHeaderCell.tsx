import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Column, ColumnKey, SortDir, SortableColumnKey } from './types';

export default function SortableHeaderCell({
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  column: Column;
  sortBy: ColumnKey;
  sortDir: SortDir;
  onSort: (columnKey: SortableColumnKey) => void;
}) {
  const isActive = sortBy === column.key;

  if (!column.sortable) {
    return (
      <th className="px-5 py-2.5 font-medium text-left uppercase">
        {column.label}
      </th>
    );
  }

  return (
    <th className="px-5 py-2.5 font-medium text-left">
      <button
        onClick={() => onSort(column.key as SortableColumnKey)}
        className={`flex items-center gap-1 cursor-pointer select-none hover:text-indigo-700 ${
          isActive ? 'text-indigo-700' : 'text-gray-400'
        } uppercase`}
      >
        {column.label}
        {isActive ? (
          sortDir === 'ASC' ? (
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
