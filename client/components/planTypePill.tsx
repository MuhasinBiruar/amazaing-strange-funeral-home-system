import type { DeceasedRecord } from 'shared';
import {
  Banknote,
  HeartHandshake,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
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

const PLAN_TYPE_ICONS: Record<PlanType, LucideIcon> = {
  Direct: Banknote,
  Life: HeartHandshake,
  LGU: Landmark,
};

/** A case's plan type, colored the same everywhere it shows. */
export default function PlanTypePill({ plantype }: { plantype: PlanType }) {
  const Icon = PLAN_TYPE_ICONS[plantype];

  return (
    <PillBadge variant={PLAN_TYPE_VARIANTS[plantype]}>
      <span className="inline-flex items-center gap-1">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {PLAN_TYPE_LABELS[plantype]}
      </span>
    </PillBadge>
  );
}
