import { useEffect, useState } from 'react';
import type { LifeplanCompanyAggregate } from 'shared';
import { getLifeplanCompanies } from '@/services/lifeplansService';
import { fieldClass, labelClass } from '@/components/formStyles';
import InlineError from '@/components/inlineError';

export default function CompanySection({
  companyid,
  onChange,
  error,
}: {
  companyid: number | null;
  onChange: (companyid: number | null) => void;
  error?: string;
}) {
  const [companies, setCompanies] = useState<LifeplanCompanyAggregate[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    getLifeplanCompanies({
      page: 1,
      limit: 100,
      sortBy: 'companyname',
      sortOrder: 'asc',
      signal: controller.signal,
    })
      .then((res) => setCompanies(res.data))
      .catch((err) => {
        if (!controller.signal.aborted)
          console.error('Failed to load life plan companies:', err);
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <label className={labelClass}>Company</label>
      <select
        value={companyid ?? ''}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        className={`${fieldClass} cursor-pointer`}
      >
        <option value="">Select a company...</option>
        {companies.map((c) => (
          <option key={c.companyid} value={c.companyid}>
            {c.companyname}
          </option>
        ))}
      </select>
      <InlineError error={error} />
    </div>
  );
}
