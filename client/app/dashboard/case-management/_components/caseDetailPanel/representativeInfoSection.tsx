import type { Dispatch, SetStateAction } from 'react';
import { fieldClass, labelClass } from '../fieldStyles';
import LoadingButton from '@/components/loadingButton';
import type { RepresentativeForm } from './types';

export default function RepresentativeInfoSection({
  form,
  setForm,
  onSave,
  isSaving,
  saveError,
  isSaved,
}: {
  form: RepresentativeForm | null;
  setForm: Dispatch<SetStateAction<RepresentativeForm | null>>;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  isSaved: boolean;
}) {
  function update<K extends keyof RepresentativeForm>(
    key: K,
    value: RepresentativeForm[K],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Representative information
      </h3>

      {!form && (
        <p className="text-sm text-gray-400">No representative on file.</p>
      )}

      {form && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input
                value={form.firstname}
                onChange={(e) => update('firstname', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Middle name</label>
              <input
                value={form.middlename}
                onChange={(e) => update('middlename', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Last name</label>
            <input
              value={form.lastname}
              onChange={(e) => update('lastname', e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Relationship</label>
              <input
                value={form.relationship}
                onChange={(e) => update('relationship', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contact number</label>
              <input
                value={form.contactnumber}
                onChange={(e) => update('contactnumber', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className={`${fieldClass} resize-y`}
            />
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          {isSaved && !saveError && (
            <p className="text-xs text-emerald-600">Saved.</p>
          )}

          <LoadingButton
            type="button"
            isLoading={isSaving}
            onClick={onSave}
            label="Save changes"
            loadingLabel="Saving..."
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
        </>
      )}
    </section>
  );
}
