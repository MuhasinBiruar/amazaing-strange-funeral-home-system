'use client';

import { useState } from 'react';
import type { DeceasedRecord } from 'shared';
import { ChevronDown, Info } from 'lucide-react';
import ServiceStatusPill, {
  type ServiceStatus,
} from '@/components/serviceStatusPill';
import { PLAN_TYPE_LABELS } from '@/components/planTypePill';

type PlanType = DeceasedRecord['plantype'];
type Tab = 'overview' | PlanType;

/** A status and when it applies, or a heading that groups the rules below it. */
type Rule = { status: ServiceStatus; text: string } | { heading: string };

/**
 * When each status applies. Mirrors the server's status sweep
 * (server/src/lib/service-status.ts), so keep the two in step.
 */
const OVERVIEW: Rule[] = [
  { status: 'intake', text: 'Recorded at intake. No contract has been signed yet.' },
  { status: 'active', text: 'Contract signed and the service is underway.' },
  { status: 'pending', text: 'Waiting on one thing before it can close (see each plan type).' },
  { status: 'completed', text: 'The burial deadline has passed and the case is settled.' },
];

const RULES: Record<PlanType, Rule[]> = {
  Direct: [
    { status: 'active', text: 'Not fully paid, and the burial deadline has not been reached.' },
    { status: 'pending', text: 'Fully paid, waiting for the burial date.' },
    { status: 'pending', text: 'Burial deadline reached, balance still owed.' },
    { status: 'completed', text: 'Fully paid and the burial deadline has been reached.' },
  ],
  LGU: [
    { status: 'active', text: "The reimbursement is still pending and the deadline hasn't arrived." },
    {
      status: 'pending',
      text: "The reimbursement is approved, rejected or released but the deadline hasn't arrived, or the deadline has passed without a release.",
    },
    { status: 'completed', text: 'The reimbursement is released and the deadline has passed.' },
  ],
  Life: [
    { heading: 'Plan covers the whole package (never active, because nothing needs to be paid)' },
    { status: 'pending', text: 'Until the deadline.' },
    { status: 'completed', text: 'Once the deadline has passed.' },
    { heading: 'Family owes an extra amount' },
    { status: 'active', text: "While it's unpaid before the deadline." },
    { status: 'pending', text: "If it's still unpaid after the deadline." },
    { status: 'completed', text: 'Once it is paid and the deadline has passed.' },
  ],
};

const ALL_PLANS: PlanType[] = ['Direct', 'LGU', 'Life'];

/**
 * Collapsible guide to the service statuses. Pass it as a `DataTable`'s
 * `legend` wherever a table shows a service status column.
 *
 * @param plans Plan types the table can contain. A table limited to one
 * plan type (e.g. the Direct payment log) shows only that plan's rules.
 */
export default function ServiceStatusLegend({
  plans = ALL_PLANS,
}: {
  plans?: PlanType[];
}) {
  const tabs: Tab[] = plans.length > 1 ? ['overview', ...plans] : plans;
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(tabs[0]);

  const rules = tab === 'overview' ? OVERVIEW : RULES[tab];
  const tabLabel = (t: Tab) => (t === 'overview' ? 'Overview' : PLAN_TYPE_LABELS[t]);

  return (
    <section aria-label="Service status legend" className="text-xs text-gray-500">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        <Info size={14} />
        How service statuses work
        {plans.length === 1 && ` (${PLAN_TYPE_LABELS[plans[0]]})`}
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {tabs.length > 1 && (
            <div role="tablist" className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-2.5 py-1 cursor-pointer ${
                    tab === t
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {tabLabel(t)}
                </button>
              ))}
            </div>
          )}

          <dl role="tabpanel" aria-label={tabLabel(tab)} className="space-y-1.5">
            {rules.map((rule, i) =>
              'heading' in rule ? (
                <p
                  key={rule.heading}
                  className={`font-medium text-gray-600 ${i > 0 ? 'pt-1.5' : ''}`}
                >
                  {rule.heading}
                </p>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <dt className="shrink-0 w-24">
                    <ServiceStatusPill status={rule.status} />
                  </dt>
                  <dd className="leading-6">{rule.text}</dd>
                </div>
              ),
            )}
          </dl>

          <p className="text-gray-400">
            Any case with a document not yet uploaded or verified shows as
            Pending. Statuses update automatically as documents, payments, and
            dates change.
          </p>
        </div>
      )}
    </section>
  );
}
