'use client';

import { createPortal } from 'react-dom';
import type { Case } from 'shared';
import DataTable from '@/components/dataTable';
import type { DataTableColumn } from '@/components/dataTable/types';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import ServiceStatusPill from '@/components/serviceStatusPill';
import ServiceStatusLegend from '@/components/serviceStatusLegend';
import PlanTypePill from '@/components/planTypePill';
import { getCases } from '@/services/caseService';
import { formatDate } from '@/utils/format';

type ColumnKey = keyof Case;

/**
 * Every case a representative represents, including ones still at intake.
 *
 * @remarks
 * Portalled to `document.body` so it sits outside the intake `<form>`: its
 * buttons must never submit the intake.
 */
export default function RepresentativeCasesPanel({
  representativeid,
  name,
  onClose,
}: {
  representativeid: number;
  name: string;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  const columns: DataTableColumn<Case, ColumnKey>[] = [
    {
      key: 'deceased_name',
      label: 'Deceased name',
      widthClassName: 'w-48',
      cellClassName: 'px-5 py-3 text-gray-900 wrap-break-word',
      render: (c) => c.deceased_name,
    },
    {
      key: 'plantype',
      label: 'Plan type',
      widthClassName: 'w-32',
      render: (c) => <PlanTypePill plantype={c.plantype} />,
    },
    {
      key: 'servicestatus',
      label: 'Service status',
      widthClassName: 'w-32',
      render: (c) => <ServiceStatusPill status={c.servicestatus} />,
    },
    {
      key: 'datecreated',
      label: 'Date created',
      widthClassName: 'w-32',
      render: (c) => formatDate(c.datecreated),
    },
    {
      key: 'burialdatedeadline',
      label: 'Burial deadline',
      widthClassName: 'w-32',
      render: (c) => formatDate(c.burialdatedeadline),
    },
  ];

  return createPortal(
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Cases represented by ${name}`}
      badge="CASES REPRESENTING"
      title={name}
      subtitle="Every case this representative represents."
      widthClassName="sm:w-3xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <DataTable<Case, ColumnKey>
          title="Cases"
          countLabel={(total) => `${total} ${total === 1 ? 'case' : 'cases'}`}
          searchPlaceholder="Search cases..."
          columns={columns}
          rowKey={(c) => c.caseid}
          defaultSortBy="datecreated"
          defaultSortOrder="desc"
          fetchData={({ filters: _filters, ...params }) =>
            getCases({ ...params, representativeid })
          }
          emptyMessage="This representative doesn't represent any cases."
          loadErrorMessage="Could not load cases. Try again."
          legend={<ServiceStatusLegend />}
        />
      </div>
    </SidePanel>,
    document.body,
  );
}
