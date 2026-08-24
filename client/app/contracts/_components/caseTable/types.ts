import type { Case, GetCasesQuery } from 'shared';

export type ColumnKey = keyof Case;
export interface Column {
  key: ColumnKey;
  label: string;
}

export type SortOrder = GetCasesQuery['sortOrder'];

export type NullableDeceasedStatus = Case['deceased_status'] | null;
