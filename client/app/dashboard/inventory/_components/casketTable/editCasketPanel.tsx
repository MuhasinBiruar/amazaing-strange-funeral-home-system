'use client';

import type { CasketInventory } from 'shared';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import CasketForm from '../casketForm';

/** Slide-in panel for editing a casket's name, tier, and minimum stock. */
export default function EditCasketPanel({
  casket,
  onClose,
  onSaved,
}: {
  casket: CasketInventory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Edit ${casket.caskettype}`}
      badge="EDIT CASKET"
      title={casket.caskettype}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <CasketForm
          editor={{ mode: 'edit', casket }}
          onCancel={requestClose}
          onSaved={onSaved}
        />
      </div>
    </SidePanel>
  );
}
