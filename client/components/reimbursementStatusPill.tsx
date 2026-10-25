import type { LguCase } from 'shared';
import PillBadge, { type BadgeVariant } from '@/components/pillBadge';
import { titleCase } from '@/utils/format';

const STATUS_VARIANTS: Record<LguCase['reimbursementstatus'], BadgeVariant> = {
  released: 'info',
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

/** An LGU case's reimbursement status, colored the same everywhere it shows. */
export default function ReimbursementStatusPill({
  status,
}: {
  status: LguCase['reimbursementstatus'];
}) {
  return (
    <PillBadge variant={STATUS_VARIANTS[status]}>{titleCase(status)}</PillBadge>
  );
}
