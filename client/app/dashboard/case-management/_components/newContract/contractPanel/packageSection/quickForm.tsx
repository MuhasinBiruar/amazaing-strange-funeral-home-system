import type { Dispatch, SetStateAction } from 'react';
import { fieldClass, labelClass } from '../fieldStyles';
import PackageTypeButtons from './packageTypeButtons';
import type { PackageDraft } from './types';

export default function QuickForm({
  draft,
  setDraft,
}: {
  draft: PackageDraft;
  setDraft: Dispatch<SetStateAction<PackageDraft>>;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Package type</label>
        <PackageTypeButtons
          value={draft.packagetype}
          onChange={(packagetype) =>
            setDraft((prev) => ({ ...prev, packagetype }))
          }
        />
      </div>

      <div>
        <label htmlFor="pkg-name" className={labelClass}>
          Package name
        </label>
        <input
          id="pkg-name"
          required
          value={draft.packagename}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, packagename: e.target.value }))
          }
          placeholder="e.g. Silver Memorial Package"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pkg-price" className={labelClass}>
            Price (PHP)
          </label>
          <input
            id="pkg-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={draft.price}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, price: e.target.value }))
            }
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="pkg-embalmingperiod" className={labelClass}>
            Embalming period (days)
          </label>
          <input
            id="pkg-embalmingperiod"
            type="number"
            min="0"
            step="1"
            required
            value={draft.embalmingperiod}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                embalmingperiod: e.target.value,
              }))
            }
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pkg-inclusions" className={labelClass}>
          Inclusions{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="pkg-inclusions"
          rows={3}
          value={draft.inclusions}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, inclusions: e.target.value }))
          }
          className={`${fieldClass} resize-y`}
        />
      </div>
    </div>
  );
}
