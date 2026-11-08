'use client';

import { useState } from 'react';
import type { CasketInventory, PackageWithCasket } from 'shared';
import { createPackageQuerySchema } from 'shared';
import { createPackage, updatePackage } from '@/services/packageService';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import PackageTypeButtons from '@/app/dashboard/case-management/_components/newContract/contractPanel/packageSection/packageTypeButtons';
import CasketPicker from '@/app/dashboard/case-management/_components/newContract/contractPanel/packageSection/casketPicker';
import type { PackageType } from '@/app/dashboard/case-management/_components/newContract/contractPanel/packageSection/types';

export default function PackagePanel({
  package: initial,
  onClose,
  onSaved,
}: {
  package: PackageWithCasket | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [name, setName] = useState(initial?.packagename ?? '');
  const [type, setType] = useState<PackageType | ''>(
    (initial?.packagetype as PackageType | undefined) ?? '',
  );
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [period, setPeriod] = useState(
    initial ? String(initial.embalmingperiod) : '',
  );
  const [inclusions, setInclusions] = useState(initial?.inclusions ?? '');
  const [casket, setCasket] = useState<CasketInventory | null>(
    initial?.casketid && initial.caskettype
      ? {
          casketid: initial.casketid,
          caskettype: initial.caskettype,
          caskettier: null,
          currentstock: initial.casket_currentstock ?? 0,
          minimumthreshold: 0,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!price.trim()) {
      setError('Price is required.');
      return;
    }
    if (!period.trim()) {
      setError('Embalming period is required.');
      return;
    }

    const parsed = createPackageQuerySchema.safeParse({
      packagename: name.trim(),
      packagetype: type,
      price: Number(price),
      embalmingperiod: Number(period),
      inclusions: inclusions.trim() || null,
      casketid: casket?.casketid,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the package fields.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (initial) await updatePackage(initial.packageid, parsed.data);
      else await createPackage(parsed.data);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save package.');
      setSaving(false);
    }
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={initial ? 'Edit package' : 'Create package'}
      badge={initial ? 'EDIT PACKAGE' : 'NEW PACKAGE'}
      title={initial ? initial.packagename : 'Create Package'}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <label className={labelClass}>Package name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="e.g. Silver Memorial Package"
          />
        </div>
        <div>
          <label className={labelClass}>Package type</label>
          <PackageTypeButtons
            value={type}
            onChange={(value) => setType(value)}
          />
        </div>
        <CasketPicker
          packagetype={type}
          value={casket}
          onChange={setCasket}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Price (PHP)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Embalming period (days)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Inclusions (optional)</label>
          <textarea
            rows={4}
            value={inclusions}
            onChange={(e) => setInclusions(e.target.value)}
            className={`${fieldClass} resize-y`}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <LoadingButton
            type="button"
            isLoading={saving}
            onClick={() => void save()}
            label={initial ? 'Save changes' : 'Create package'}
            loadingLabel="Saving..."
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          />
        </div>
      </div>
    </SidePanel>
  );
}
