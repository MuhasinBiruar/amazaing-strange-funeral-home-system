import type { Lgu } from 'shared';
import SearchSelect from '@/components/searchSelect';
import { getLgus } from '@/services/lgusService';

export type LguOption = Pick<Lgu, 'lguid' | 'lguname'>;

/** LGU picker; the LGU counterpart of `CompanySearchSelect`. */
export default function LguSearchSelect({
  lguid,
  lguname,
  onChange,
  error,
}: {
  lguid: number | null;
  lguname: string | null;
  onChange: (lgu: LguOption) => void;
  error?: string;
}) {
  const value: LguOption | null =
    lguid === null ? null : { lguid, lguname: lguname ?? `LGU #${lguid}` };

  return (
    <SearchSelect<LguOption>
      label="LGU"
      placeholder="Search LGUs..."
      value={value}
      onChange={onChange}
      fetchPage={(params) =>
        getLgus({
          ...params,
          sortBy: 'lguname',
          sortOrder: 'asc',
        })
      }
      getKey={(l) => l.lguid}
      getLabel={(l) => l.lguname}
      error={error}
    />
  );
}
