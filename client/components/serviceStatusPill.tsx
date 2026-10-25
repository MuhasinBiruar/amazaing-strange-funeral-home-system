import type { DeceasedRecord } from 'shared';
import PillBadge, { type BadgeVariant } from '@/components/pillBadge';
import { titleCase } from '@/utils/format';

type ServiceStatus = DeceasedRecord['servicestatus'];

const STATUS_VARIANTS: Record<ServiceStatus, BadgeVariant> = {
  intake: 'gray',
  active: 'info',
  pending: 'warning',
  completed: 'success',
};

export default function ServiceStatusPill({
  status,
}: {
  status: ServiceStatus;
}) {
  return (
    <PillBadge variant={STATUS_VARIANTS[status]}>{titleCase(status)}</PillBadge>
  );
}
