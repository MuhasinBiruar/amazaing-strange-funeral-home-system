import { useState } from 'react';
import type { UncontractedDeceased } from 'shared';
import DeceasedTable from './deceasedTable';
import ContractPanel from './contractPanel';

/**
 * The "New contract" flow: pick a deceased record that has no contract yet,
 * then fill in the contract in a panel that slides in from the right.
 *
 * @remarks
 * The panel overlays the page rather than reflowing it, which keeps the table's
 * `useDynamicLimit` measurements valid while the panel is open.
 */
export default function NewContract({ onCreated }: { onCreated: () => void }) {
  const [selected, setSelected] = useState<UncontractedDeceased | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
            onCreated();
          }}
        />
      )}
    </>
  );
}
