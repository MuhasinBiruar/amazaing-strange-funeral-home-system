'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DeceasedRecord, Representative } from 'shared';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { getDeceasedRecord } from '@/services/deceasedRecordService';
import { getRepresentative } from '@/services/representativeService';
import { formatDate, titleCase } from '@/utils/format';

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 wrap-break-word">{value}</dd>
    </div>
  );
}

export default function CasePreviewPanel({
  caseid,
  onClose,
}: {
  caseid: number;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [record, setRecord] = useState<DeceasedRecord | null>(null);
  const [representative, setRepresentative] = useState<Representative | null>(
    null,
  );
  const [isLoadingRepresentative, setIsLoadingRepresentative] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [representativeError, setRepresentativeError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      setRepresentativeError(null);
      try {
        const deceased = await getDeceasedRecord(caseid);
        if (controller.signal.aborted) return;
        setRecord(deceased);
        setRepresentative(null);
        setIsLoading(false);

        if (!deceased.representedby) {
          setIsLoadingRepresentative(false);
          return;
        }

        setIsLoadingRepresentative(true);
        try {
          const rep = await getRepresentative(deceased.representedby);
          if (!controller.signal.aborted) setRepresentative(rep);
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error('Failed to load case representative:', error);
          setRepresentativeError(
            'Could not load representative information. Try again.',
          );
        } finally {
          if (!controller.signal.aborted) setIsLoadingRepresentative(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load case preview:', error);
        setLoadError('Could not load this case. Try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [caseid]);

  const deceasedName = record
    ? [record.firstname, record.middlename, record.lastname]
        .filter(Boolean)
        .join(' ')
    : 'Case details';

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Case details for case ${caseid}`}
      badge={`CASE #${caseid}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title={deceasedName}
      subtitle="Read-only case details"
      widthClassName="sm:w-2xl"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-500">
            Loading case details...
          </p>
        )}

        {!isLoading && loadError && (
          <p className="text-sm text-red-600">{loadError}</p>
        )}

        {!isLoading && record && (
          <>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Deceased information
              </h3>
              <dl className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Service status"
                  value={titleCase(record.servicestatus)}
                />
                <DetailField label="Plan type" value={record.plantype} />
                <DetailField
                  label="Date created"
                  value={formatDate(record.datecreated)}
                />
                <DetailField
                  label="Date of death"
                  value={formatDate(record.dateofdeath)}
                />
                <DetailField
                  label="Cause of death"
                  value={record.causeofdeath ?? '—'}
                />
                <DetailField
                  label="Type of death"
                  value={record.typeofdeath ?? '—'}
                />
                <DetailField
                  label="Physical description"
                  value={record.physicaldescription ?? '—'}
                />
                <DetailField
                  label="Matured life plan"
                  value={record.hasmaturedlifeplan ? 'Yes' : 'No'}
                />
                <DetailField
                  label="Advanced decomposition / open wounds"
                  value={record.hasadvanceddecomposition ? 'Yes' : 'No'}
                />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Representative information
              </h3>
              {representative ? (
                <dl className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Name"
                    value={[
                      representative.firstname,
                      representative.middlename,
                      representative.lastname,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                  <DetailField
                    label="Relationship"
                    value={representative.relationship ?? '—'}
                  />
                  <DetailField
                    label="Contact number"
                    value={representative.contactnumber}
                  />
                  <DetailField
                    label="Address"
                    value={representative.address ?? '—'}
                  />
                </dl>
              ) : isLoadingRepresentative ? (
                <p className="text-sm text-gray-500">
                  Loading representative information...
                </p>
              ) : representativeError ? (
                <p className="text-sm text-red-600">{representativeError}</p>
              ) : (
                <p className="text-sm text-gray-500">No representative on file.</p>
              )}
            </section>

            <Link
              href={`/dashboard/case-management?tab=view&caseid=${caseid}`}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Edit in Case Management
            </Link>
          </>
        )}
      </div>
    </SidePanel>
  );
}
