'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { CasePreview } from 'shared';
import { labelClass } from '@/components/formStyles';
import PlanTypePill from '@/components/planTypePill';
import ReimbursementStatusPill from '@/components/reimbursementStatusPill';
import ServiceStatusPill from '@/components/serviceStatusPill';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import { formatCurrency, formatDate } from '@/utils/format';

const sectionHeadingClass =
  'text-xs font-semibold text-gray-400 uppercase tracking-wide';

function joinName(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

function amountOrDash(value: number | null) {
  return value === null ? '—' : formatCurrency(value);
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  /** Spans both columns, for longer text. */
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <p className={labelClass}>{label}</p>
      <div className="text-sm text-gray-700 wrap-break-word">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className={sectionHeadingClass}>{title}</h3>
      {children}
    </section>
  );
}

/**
 * Read-only view of a case, laid out like the case detail panel in Case
 * Management.
 *
 * @param fetchPreview - Staff and life plan agents load cases from different
 * endpoints; agents only reach their own company's cases.
 * @param showEditLink - Links to the editable case in Case Management, which
 * only staff can open.
 */
export default function CasePreviewPanel({
  caseid,
  fetchPreview,
  showEditLink = false,
  onClose,
}: {
  caseid: number;
  fetchPreview: (caseid: number, signal: AbortSignal) => Promise<CasePreview>;
  showEditLink?: boolean;
  onClose: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [preview, setPreview] = useState<CasePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await fetchPreview(caseid, controller.signal);
        if (!controller.signal.aborted) setPreview(result);
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
  }, [caseid, fetchPreview]);

  const deceased = preview?.deceased;
  const representative = preview?.representative;
  const plan = preview?.plan;
  const contract = preview?.contract;

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Case details for case ${caseid}`}
      badge={`CASE #${caseid}`}
      badgeClassName="bg-orange-100 text-orange-800"
      title={
        deceased
          ? joinName(deceased.firstname, deceased.middlename, deceased.lastname)
          : 'Case details'
      }
      subtitle="Read-only case details"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {!isLoading && loadError && (
          <p className="text-sm text-red-500">{loadError}</p>
        )}

        {!isLoading && !loadError && deceased && plan && (
          <>
            <Section title="Deceased information">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Service status">
                  <ServiceStatusPill status={deceased.servicestatus} />
                </Field>
                <Field label="Date created">
                  {formatDate(deceased.datecreated)}
                </Field>
                <Field label="Date of death">
                  {formatDate(deceased.dateofdeath)}
                </Field>
                <Field label="Location of death">
                  {deceased.locationofdeath ?? '—'}
                </Field>
                <Field label="Cause of death">
                  {deceased.causeofdeath ?? '—'}
                </Field>
                <Field label="Type of death">
                  {deceased.typeofdeath ?? '—'}
                </Field>
                <Field label="Physical description" wide>
                  {deceased.physicaldescription ?? '—'}
                </Field>
                <Field label="Advanced decomposition / open wounds" wide>
                  {deceased.hasadvanceddecomposition ? 'Yes' : 'No'}
                </Field>
              </div>
            </Section>

            <Section title="Plan">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan type" wide>
                  <PlanTypePill plantype={plan.plantype} />
                </Field>

                {plan.lifeplan && (
                  <>
                    <Field label="Company" wide>
                      {plan.lifeplan.companyname ?? '—'}
                    </Field>
                    <Field label="Plan number">
                      {plan.lifeplan.plannumber ?? '—'}
                    </Field>
                    <Field label="Total amount">
                      {amountOrDash(plan.lifeplan.totalamount)}
                    </Field>
                    <Field label="Plan holder name">
                      {plan.lifeplan.planholdername ?? '—'}
                    </Field>
                    <Field label="Uses casket/benefits">
                      {plan.lifeplan.use_benefits ? 'Yes' : 'No'}
                    </Field>
                  </>
                )}

                {plan.lgucase && (
                  <>
                    <Field label="LGU" wide>
                      {plan.lgucase.lguname ?? '—'}
                    </Field>
                    <Field label="Reimbursement status">
                      <ReimbursementStatusPill
                        status={plan.lgucase.reimbursementstatus}
                      />
                    </Field>
                    <Field label="Reimbursement amount">
                      {formatCurrency(plan.lgucase.reimbursementamount)}
                    </Field>
                  </>
                )}
              </div>
            </Section>

            <Section title="Contract">
              {contract ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Signed">
                    {formatDate(contract.signeddate)}
                  </Field>
                  <Field label="Total">
                    {formatCurrency(contract.totalamount)}
                  </Field>
                  <Field label="Burial deadline">
                    {formatDate(contract.burialdatedeadline)}
                  </Field>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No contract yet.</p>
              )}
            </Section>

            <Section title="Representative information">
              {representative ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name">
                    {joinName(
                      representative.firstname,
                      representative.middlename,
                      representative.lastname,
                    )}
                  </Field>
                  <Field label="Relationship">
                    {representative.relationship ?? '—'}
                  </Field>
                  <Field label="Contact number">
                    {representative.contactnumber}
                  </Field>
                  <Field label="Address">{representative.address ?? '—'}</Field>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No representative on file.
                </p>
              )}
            </Section>

            {showEditLink && (
              <Link
                href={`/dashboard/case-management?tab=view&caseid=${caseid}`}
                className="inline-flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700"
              >
                Edit in Case Management
              </Link>
            )}
          </>
        )}
      </div>
    </SidePanel>
  );
}
