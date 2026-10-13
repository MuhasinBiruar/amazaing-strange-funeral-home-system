import type { FilterDef, DataTableColumn } from '@/components/dataTable/types';
import type { BadgeVariant } from '@/components/pillBadge';
import PillBadge from '@/components/pillBadge';
import {
  accessPageEnum,
  getAccessPageLabel,
  type GetStaffRow,
  type StaffRole,
} from 'shared';

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

const COLUMNS_ROLE_BADGE: Record<StaffRole, BadgeVariant> = {
  superadmin: 'purple',
  admin: 'indigo',
  user: 'gray',
  lifeplan_agent: 'warning',
};

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
      <PillBadge variant={COLUMNS_ROLE_BADGE[r.role ?? 'user']}>
        {r.role ?? '—'}
      </PillBadge>
    ),
  },
  {
    key: 'jobRole',
    label: 'Job role',
    widthClassName: 'w-28',
    render: (r) => r.jobRole ?? '—',
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
