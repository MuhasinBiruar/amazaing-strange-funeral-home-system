import type {
  GetUncontractedDeceasedQuery,
  UncontractedDeceased,
} from 'shared';
import type { SortableColumn } from '../../table/sortableHeaderCell';

export type ColumnKey = keyof UncontractedDeceased;
export type Column = SortableColumn<ColumnKey>;

export type SortOrder = GetUncontractedDeceasedQuery['sortOrder'];

export type NullableDeceasedStatus =
  UncontractedDeceased['servicestatus'] | null;
