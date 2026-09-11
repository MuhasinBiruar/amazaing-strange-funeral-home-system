import type { Case, GetCasesQuery } from 'shared';
import type { SortableColumn } from '@/components/table/sortableHeaderCell';

export type ColumnKey = keyof Case;
export type Column = SortableColumn<ColumnKey>;

export type SortOrder = GetCasesQuery['sortOrder'];

export type NullableDeceasedStatus = Case['servicestatus'] | null;
