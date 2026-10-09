import DataTable from '@/components/dataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import type {
  DataTableColumn,
  DateRangeValue,
  FilterDef,
} from '@/components/dataTable/types';
import type { Delivery, DeliverySource } from 'shared';
import { getDeliveries } from '@/services/deliveryService';

type ColumnKey = keyof Delivery;

type Filters = {
  source: DeliverySource | null;
  dateRange: DateRangeValue;
};

const DEFAULT_FILTERS: Filters = {
  source: null,
  dateRange: { from: null, to: null },
};

const FILTERS: FilterDef<Filters>[] = [
  {
    type: 'select',
    key: 'source',
    options: [
      { label: 'All item types', value: null },
      { label: 'Casket', value: 'casket' },
      { label: 'Formalin', value: 'formalin' },
    ],
  },
  {
    type: 'dateRange',
    key: 'dateRange',
    label: 'Filter by delivery date',
  },
];

const COLUMNS: DataTableColumn<Delivery, ColumnKey>[] = [
  {
    key: 'item_type',
    label: 'Item type',
    widthClassName: 'w-55',
    cellClassName: 'px-5 py-3 text-gray-700 wrap-break-word',
    render: (d) => d.item_type,
  },
  {
    key: 'quantityreceived',
    label: 'Quantity received',
    widthClassName: 'w-35',
    render: (d) => d.quantityreceived,
  },
  {
    key: 'deliverydate',
    label: 'Delivery date',
    widthClassName: 'w-35',
    render: (d) => formatDate(d.deliverydate),
  },
  {
    key: 'totalamountpaid',
    label: 'Total amount paid',
    widthClassName: 'w-40',
    render: (d) => formatCurrency(d.totalamountpaid),
  },
];

/**
 * Read-only log of every casket and formalin delivery
 * (`casketdelivery` + `formalindelivery`).
 */
export default function DeliveryTable() {
  return (
    <DataTable<Delivery, ColumnKey, Filters>
      title="Deliveries"
      countLabel={(total) => `${total} items`}
      searchPlaceholder="Search item type..."
      filters={FILTERS}
      defaultFilters={DEFAULT_FILTERS}
      columns={COLUMNS}
      // `deliveryid` is only unique within its own source table.
      rowKey={(d) => `${d.source}-${d.deliveryid}`}
      defaultSortBy="deliverydate"
      defaultSortOrder="desc"
      fetchData={({ filters, ...params }) =>
        getDeliveries({
          ...params,
          source: filters.source ?? undefined,
          startDate: filters.dateRange.from ?? undefined,
          endDate: filters.dateRange.to ?? undefined,
        })
      }
      emptyMessage="No deliveries match your search."
      loadErrorMessage="Could not load deliveries. Try again."
      bodyOffsetClassName="top-17.25"
    />
  );
}
