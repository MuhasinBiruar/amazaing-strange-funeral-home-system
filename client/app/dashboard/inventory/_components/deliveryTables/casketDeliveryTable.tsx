import DataTable from '@/components/dataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import { createPackageQuerySchema, type CasketDelivery } from 'shared';
import { getCasketDeliveries } from '@/services/deliveryService';

type ColumnKey = keyof CasketDelivery;

type Filters = {
  tier: string | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  tier: null,
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'tier',
    options: [
      { label: 'All tiers', value: null },
      ...createPackageQuerySchema.shape.packagetype.options.map((tier) => ({
        label: tier,
        value: tier,
      })),
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by delivery date',
  },
];

const COLUMNS: DataTableColumn<CasketDelivery, ColumnKey>[] = [
  {
    key: 'caskettype',
    label: 'Casket',
    widthClassName: 'w-50',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) => d.caskettype ?? 'Unlinked casket',
  },
  {
    key: 'caskettier',
    label: 'Tier',
    widthClassName: 'w-35',
    render: (d) => d.caskettier ?? '—',
  },
  {
    key: 'quantityreceived',
    label: 'Qty received',
    widthClassName: 'w-30',
    render: (d) => d.quantityreceived.toLocaleString('en-US'),
  },
  {
    key: 'unitcost',
    label: 'Unit cost',
    widthClassName: 'w-35',
    render: (d) => (d.unitcost === null ? '—' : formatCurrency(d.unitcost)),
  },
  {
    key: 'totalamountpaid',
    label: 'Total paid',
    widthClassName: 'w-37.5',
    render: (d) => formatCurrency(d.totalamountpaid),
  },
  {
    key: 'deliverydate',
    label: 'Delivery date',
    widthClassName: 'w-35',
    render: (d) => formatDate(d.deliverydate),
  },
];

/** Read-only log of casket deliveries. */
export default function CasketDeliveryTable() {
  return (
    <DataTable<CasketDelivery, ColumnKey, Filters>
      title="Casket deliveries"
      countLabel={(total) => `${total} deliveries`}
      searchPlaceholder="Search casket or tier..."
      filters={FILTERS}
      defaultFilters={DEFAULT_FILTERS}
      columns={COLUMNS}
      rowKey={(d) => d.deliveryid}
      defaultSortBy="deliverydate"
      defaultSortOrder="desc"
      fetchData={({ filters, ...params }) =>
        getCasketDeliveries({
          ...params,
          tier: filters.tier ?? undefined,
          startDate: filters.dateRange.from ?? undefined,
          endDate: filters.dateRange.to ?? undefined,
        })
      }
      emptyMessage="No casket deliveries match your search."
      loadErrorMessage="Could not load casket deliveries. Try again."
      bodyOffsetClassName="top-17.25"
    />
  );
}
