import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { UncontractedDeceased } from 'shared';
import { getUncontractedDeceased } from '@/services/deceasedRecordService';
import DeceasedTable from './deceasedTable';
import ContractPanel from './contractPanel';

/**
 * The "New contract" flow: pick a deceased record that has no contract yet,
 * then fill in the contract in a panel that slides in from the right.
 *
 * @remarks
 * The panel overlays the page rather than reflowing it, which keeps the table's
 * `useDynamicLimit` measurements valid while the panel is open.
 *
 * A `caseid` search param opens the panel for that specific record
 * immediately on mount — e.g. arriving here right after creating it in
 * intake — without waiting for it to be visible in (or clicked from) the
 * table below. Read directly from the URL rather than threaded down as a
 * prop, matching how the parent page already treats `tab` as the source of
 * truth instead of component state.
 */
export default function NewContract({ onCreated }: { onCreated?: () => void }) {
  const searchParams = useSearchParams();
  const caseidParam = searchParams.get('caseid');
  const initialCaseId = caseidParam ? Number(caseidParam) : undefined;

  const [selected, setSelected] = useState<UncontractedDeceased | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (initialCaseId === undefined) return;
    const controller = new AbortController();

    async function fetchInitial() {
      try {
        const res = await getUncontractedDeceased({
          page: 1,
          limit: 1,
          sortBy: 'caseid',
          sortOrder: 'desc',
          caseid: initialCaseId,
          signal: controller.signal,
        });
        if (res.data[0]) setSelected(res.data[0]);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load the newly created record:', error);
      }
    }
    fetchInitial();

    return () => controller.abort();
    // Only ever runs for the id this component was first mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DeceasedTable
        selectedCaseId={selected?.caseid ?? null}
        onSelect={setSelected}
        refreshKey={refreshKey}
      />

      {selected && (
        <ContractPanel
          key={selected.caseid}
          deceased={selected}
          onClose={() => setSelected(null)}
          onCreated={() => {
            // The record now has a contract, so it drops out of this list and
            // shows up in the case table.
            setSelected(null);
            setRefreshKey((k) => k + 1);
            onCreated?.();
          }}
        />
      )}
    </>
  );
}
