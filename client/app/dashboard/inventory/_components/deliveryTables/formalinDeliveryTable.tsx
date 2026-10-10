import DataTable from '@/components/dataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { FormalinDelivery } from 'shared';
import { getFormalinDeliveries } from '@/services/deliveryService';

type ColumnKey = keyof FormalinDelivery;

type Filters = {
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by delivery date',
  },
];

const formatLiters = (value: number) =>
  `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} L`;

const COLUMNS: DataTableColumn<FormalinDelivery, ColumnKey>[] = [
  {
    key: 'quantityreceived',
    label: 'Qty received',
    widthClassName: 'w-32.5',
    render: (d) => formatLiters(d.quantityreceived),
  },
  {
    key: 'unitcost',
    label: 'Cost per liter',
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

/** Read-only log of formalin deliveries. */
export default function FormalinDeliveryTable() {
  return (
    <DataTable<FormalinDelivery, ColumnKey, Filters>
      title="Formalin deliveries"
      countLabel={(total) => `${total} deliveries`}
      searchPlaceholder="Search qty received..."
      filters={FILTERS}
      defaultFilters={DEFAULT_FILTERS}
      columns={COLUMNS}
      rowKey={(d) => d.deliveryid}
      defaultSortBy="deliverydate"
      defaultSortOrder="desc"
      fetchData={({ filters, ...params }) =>
        getFormalinDeliveries({
          ...params,
          startDate: filters.dateRange.from ?? undefined,
          endDate: filters.dateRange.to ?? undefined,
        })
      }
      emptyMessage="No formalin deliveries match your search."
      loadErrorMessage="Could not load formalin deliveries. Try again."
      bodyOffsetClassName="top-17.25"
    />
  );
}
