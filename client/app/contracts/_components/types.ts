import type { ContractSchema } from '@/app/services/contractService';

// TODO: Refactor me when there is shared folder of schemas

export type ColumnKey = keyof ContractSchema;

export type SortableColumnKey = Exclude<ColumnKey, 'inclusions'>;

export type SortDir = 'ASC' | 'DESC';

export interface Column {
  key: ColumnKey;
  label: string;
  sortable: boolean;
}
