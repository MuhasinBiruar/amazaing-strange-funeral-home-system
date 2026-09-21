import type { ValueOf } from 'shared/utils';
import type { AdminValidationErrors } from '../app/dashboard/admin/_components/staffPanel/types';

export default function InlineError({
  error,
}: {
  error: ValueOf<AdminValidationErrors>;
}) {
  return (
    <>
      {error && <p className="text-red-700 text-xs font-bold mt-1">{error}</p>}
    </>
  );
}
