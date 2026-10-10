'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  casketTierEnum,
  createCasketInventoryQuerySchema,
  type CasketInventory,
} from 'shared';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import { createCasket, updateCasket } from '@/services/casketInventoryService';

export type CasketEditor =
  { mode: 'create' } | { mode: 'edit'; casket: CasketInventory };

/**
 * Inline form for adding a casket or editing one's name, tier, and minimum.
 *
 * @remarks
 * May be rendered inside another `<form>` (the delivery panel), so Enter is
 * intercepted here to save this form instead of submitting the outer one.
 */
export default function CasketForm({
  editor,
  onCancel,
  onSaved,
}: {
  editor: CasketEditor;
  onCancel: () => void;
  onSaved: (casket: CasketInventory) => void;
}) {
  const initial = editor.mode === 'edit' ? editor.casket : null;
  const [caskettype, setCaskettype] = useState(initial?.caskettype ?? '');
  const [caskettier, setCaskettier] = useState(initial?.caskettier ?? '');
  const [minimum, setMinimum] = useState(
    initial ? String(initial.minimumthreshold) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setError(null);
    const result = createCasketInventoryQuerySchema.safeParse({
      caskettype,
      caskettier: caskettier === '' ? undefined : caskettier,
      minimumthreshold: minimum === '' ? undefined : Number(minimum),
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      onSaved(
        editor.mode === 'create'
          ? await createCasket(result.data)
          : await updateCasket(editor.casket.casketid, result.data),
      );
    } catch (err) {
      setIsSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to save casket.');
    }
  }

  const saveOnEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void save();
    }
  };

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-3">
      <p className="text-sm font-semibold text-gray-900">
        {editor.mode === 'create' ? 'New casket' : 'Edit casket'}
      </p>

      <div>
        <label htmlFor="casket-name" className={labelClass}>
          Name
        </label>
        <input
          id="casket-name"
          autoFocus
          value={caskettype}
          onChange={(e) => setCaskettype(e.target.value)}
          onKeyDown={saveOnEnter}
          placeholder="e.g., Mahogany Casket"
          className={`${fieldClass} bg-white`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="casket-tier" className={labelClass}>
            Tier
          </label>
          <select
            id="casket-tier"
            value={caskettier}
            onChange={(e) => setCaskettier(e.target.value)}
            className={`${fieldClass} bg-white cursor-pointer`}
          >
            <option value="" disabled>
              Select a tier...
            </option>
            {casketTierEnum.options.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="casket-minimum" className={labelClass}>
            Minimum stock
          </label>
          <input
            id="casket-minimum"
            type="number"
            min={0}
            step={1}
            value={minimum}
            onChange={(e) => setMinimum(e.target.value)}
            onKeyDown={saveOnEnter}
            className={`${fieldClass} bg-white`}
          />
        </div>
      </div>

      {editor.mode === 'create' ? (
        <p className="text-xs text-gray-500">
          New caskets start with no stock. This delivery adds the first stock.
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Stock ({editor.casket.currentstock}) only changes through deliveries
          and contracts.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <LoadingButton
          type="button"
          onClick={() => void save()}
          isLoading={isSaving}
          label={editor.mode === 'create' ? 'Add casket' : 'Save changes'}
          loadingLabel="Saving..."
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        />
      </div>
    </div>
  );
}
