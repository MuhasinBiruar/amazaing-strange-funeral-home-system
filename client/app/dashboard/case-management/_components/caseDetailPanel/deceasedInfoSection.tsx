import type { Dispatch, SetStateAction } from 'react';
import { fieldClass, labelClass } from '../fieldStyles';
import LoadingButton from '@/components/loadingButton';
import type { DeceasedForm } from './types';

export default function DeceasedInfoSection({
  form,
  setForm,
  onSave,
  isSaving,
  saveError,
  isSaved,
}: {
  form: DeceasedForm;
  setForm: Dispatch<SetStateAction<DeceasedForm | null>>;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  isSaved: boolean;
}) {
  function update<K extends keyof DeceasedForm>(
    key: K,
    value: DeceasedForm[K],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Deceased information
      </h3>

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
          <label className={labelClass}>Service status</label>
          <select
            value={form.servicestatus}
            onChange={(e) =>
              update(
                'servicestatus',
                e.target.value as DeceasedForm['servicestatus'],
              )
            }
            className={`${fieldClass} cursor-pointer`}
          >
            <option value="intake">Intake</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Plan type</label>
          <select
            value={form.plantype}
            onChange={(e) =>
              update('plantype', e.target.value as DeceasedForm['plantype'])
            }
            className={`${fieldClass} cursor-pointer`}
          >
            <option value="Direct">Direct</option>
            <option value="Life">Life</option>
            <option value="LGU">LGU</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Cause of death</label>
          <input
            value={form.causeofdeath}
            onChange={(e) => update('causeofdeath', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type of death</label>
          <input
            value={form.typeofdeath}
            onChange={(e) => update('typeofdeath', e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Physical description</label>
        <textarea
          rows={2}
          value={form.physicaldescription}
          onChange={(e) => update('physicaldescription', e.target.value)}
          className={`${fieldClass} resize-y`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className={labelClass}>Date of death</label>
          <input
            type="date"
            value={form.dateofdeath}
            onChange={(e) => update('dateofdeath', e.target.value)}
            className={fieldClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-1.5">
          <input
            type="checkbox"
            checked={form.hasmaturedlifeplan}
            onChange={(e) => update('hasmaturedlifeplan', e.target.checked)}
            className="cursor-pointer"
          />
          Matured life plan
        </label>
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
    </section>
  );
}
