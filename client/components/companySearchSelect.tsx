import type { LifeplanCompany } from 'shared';
import SearchSelect from '@/components/searchSelect';
import { getLifeplanCompanies } from '@/services/lifeplansService';

export type CompanyOption = Pick<LifeplanCompany, 'companyid' | 'companyname'>;

export default function CompanySearchSelect({
  companyid,
  companyname,
  onChange,
  error,
}: {
  companyid: number | null;
  companyname: string | null;
  onChange: (company: CompanyOption) => void;
  error?: string;
}) {
  const value: CompanyOption | null =
    companyid === null
      ? null
      : { companyid, companyname: companyname ?? `Company #${companyid}` };

  return (
    <SearchSelect<CompanyOption>
      label="Company"
      placeholder="Search companies..."
      value={value}
      onChange={onChange}
      fetchPage={(params) =>
        getLifeplanCompanies({
          ...params,
          sortBy: 'companyname',
          sortOrder: 'asc',
        })
      }
      getKey={(c) => c.companyid}
      getLabel={(c) => c.companyname}
      error={error}
    />
  );
}
