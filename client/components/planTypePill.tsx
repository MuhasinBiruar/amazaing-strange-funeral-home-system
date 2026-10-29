import type { DeceasedRecord } from 'shared';
import PillBadge, { type BadgeVariant } from '@/components/pillBadge';

type PlanType = DeceasedRecord['plantype'];

const PLAN_TYPE_VARIANTS: Record<PlanType, BadgeVariant> = {
  Direct: 'success',
  Life: 'info',
  LGU: 'warning',
};

/** Display names, matching the financials and special cases tab labels. */
export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  Direct: 'Direct',
  Life: 'Life Plan',
  LGU: 'LGU',
};

/** A case's plan type, colored the same everywhere it shows. */
export default function PlanTypePill({ plantype }: { plantype: PlanType }) {
  return (
    <PillBadge variant={PLAN_TYPE_VARIANTS[plantype]}>
      {PLAN_TYPE_LABELS[plantype]}
    </PillBadge>
  );
}
