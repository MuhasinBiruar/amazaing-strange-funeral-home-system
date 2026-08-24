import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Column, ColumnKey, SortOrder } from './types';

export default function SortableHeaderCell({
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: Column;
  sortBy: ColumnKey;
  sortOrder: SortOrder;
  onSort: (columnKey: ColumnKey) => void;
}) {
  const isActive = sortBy === column.key;

  return (
    <th className="px-5 py-2.5 font-medium text-left">
      <button
        onClick={() => onSort(column.key)}
        className={`flex items-center gap-1 cursor-pointer select-none hover:text-indigo-700 ${
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
