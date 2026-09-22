import type { FilterDef, DataTableColumn } from '@/components/dataTable/types';
import { accessPageEnum, getAccessPageLabel, type GetStaffRow } from 'shared';

export type ColumnKey = keyof GetStaffRow;

export type Filters = { isActive: boolean | null };

export const DEFAULT_FILTERS: Filters = { isActive: null };

export const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'isActive',
    options: [
      { label: 'All staff', value: null },
      { label: 'Active', value: true },
      { label: 'Inactive', value: false },
    ],
  },
];

export const COLUMNS: DataTableColumn<GetStaffRow, ColumnKey>[] = [
  {
    key: 'name',
    label: 'Name',
    widthClassName: 'w-40',
    cellClassName: 'px-5 py-3 font-medium text-gray-900 wrap-break-word',
    render: (r) => r.name,
  },
  {
    key: 'username',
    label: 'Username',
    widthClassName: 'w-32',
    render: (r) => r.username ?? '—',
  },
  {
    key: 'role',
    label: 'Role',
    widthClassName: 'w-24',
    render: (r) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          r.role === 'admin'
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {r.role ?? '—'}
      </span>
    ),
  },
  {
    key: 'jobRole',
    label: 'Job role',
    widthClassName: 'w-28',
    render: (r) => r.jobRole,
  },
  {
    key: 'isActive',
    label: 'Active',
    widthClassName: 'w-20',
    render: (r) => (
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          r.isActive ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title={r.isActive ? 'Active' : 'Inactive'}
      />
    ),
  },
  {
    key: 'access',
    label: 'Access',
    widthClassName: 'w-56',
    cellClassName: 'px-5 py-3 text-gray-500 text-left wrap-break-word',
    render: (r) => {
      const enabled = accessPageEnum.options.filter((k) => r.access[k]);
      return enabled.length > 0
        ? enabled.map(getAccessPageLabel).join(', ')
        : '—';
    },
  },
];
