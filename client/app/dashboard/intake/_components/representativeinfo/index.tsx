import { User, MapPin, UserPlus, Users } from 'lucide-react';
import ExistingRepresentativePicker, {
  representativeLabel,
} from './existingRepresentativePicker';

interface RepresentativeInfoProps {
  data: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

const MODES = [
  { value: 'new', label: 'Add new representative', icon: UserPlus },
  { value: 'existing', label: 'Use existing representative', icon: Users },
] as const;

export default function RepresentativeInfo({
  data,
  onChange,
  errors = {},
}: RepresentativeInfoProps) {
  const mode = data.rep_mode === 'existing' ? 'existing' : 'new';
  const selectedId = data.rep_existingid ? Number(data.rep_existingid) : null;

  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-4 text-gray-900">
        <User size={20} />
        <h2 className="text-lg font-bold">Representative Information</h2>
      </div>

      <div
        role="radiogroup"
        aria-label="Representative"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => onChange('rep_mode', value)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              mode === value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'existing' ? (
        <div
          id="rep_existingid"
          tabIndex={-1}
          className="space-y-3 outline-none"
        >
          {selectedId !== null && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
              <span className="text-gray-700">
                <span className="font-semibold text-indigo-700">Selected:</span>{' '}
                {data.rep_existinglabel || `Representative #${selectedId}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange('rep_existingid', '');
                  onChange('rep_existinglabel', '');
                }}
                className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer shrink-0"
              >
                Clear
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Click a representative to select them. Their details stay as they
            are and can be edited later from Case Management.
          </p>
          <ExistingRepresentativePicker
            selectedId={selectedId}
            onSelect={(r) => {
              onChange('rep_existingid', String(r.representativeid));
              onChange(
                'rep_existinglabel',
                `${representativeLabel(r)} · ${r.contactnumber}`,
              );
            }}
          />
          {errors.rep_existingid && (
            <p className="text-red-700 text-xs font-bold">
              {errors.rep_existingid}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                FIRST NAME
              </label>
              <input
                id="rep_firstname"
                type="text"
                value={data.rep_firstname || ''}
                onChange={(e) => onChange('rep_firstname', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
                placeholder="First Name"
              />
              {errors.rep_firstname && (
                <p className="text-red-700 text-xs font-bold mt-1">
                  {errors.rep_firstname}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                MIDDLE NAME{' '}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="rep_middlename"
                type="text"
                value={data.rep_middlename || ''}
                onChange={(e) => onChange('rep_middlename', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
                placeholder="Middle Name"
              />
              {errors.rep_middlename && (
                <p className="text-red-700 text-xs font-bold mt-1">
                  {errors.rep_middlename}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                LAST NAME
              </label>
              <input
                id="rep_lastname"
                type="text"
                value={data.rep_lastname || ''}
                onChange={(e) => onChange('rep_lastname', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
                placeholder="Last Name"
              />
              {errors.rep_lastname && (
                <p className="text-red-700 text-xs font-bold mt-1">
                  {errors.rep_lastname}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                RELATIONSHIP
              </label>
              <input
                id="rep_relationship"
                type="text"
                value={data.rep_relationship || ''}
                onChange={(e) => onChange('rep_relationship', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
                placeholder="e.g., Spouse, Child, Sibling"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                CONTACT NUMBER
              </label>
              <input
                id="rep_contactnumber"
                type="tel"
                value={data.rep_contactnumber || ''}
                onChange={(e) => onChange('rep_contactnumber', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
                placeholder="e.g., 0912 345 6789"
              />
              {errors.rep_contactnumber && (
                <p className="text-red-700 text-xs font-bold mt-1">
                  {errors.rep_contactnumber}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              COMPLETE ADDRESS
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3 top-3 text-gray-400 pointer-events-none"
              />
              <textarea
                id="rep_address"
                value={data.rep_address || ''}
                onChange={(e) => onChange('rep_address', e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 pl-10 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 min-h-20 in-disabled:cursor-not-allowed"
                placeholder="House/Block/Lot No., Street, Barangay, City/Municipality, Province"
              />
            </div>
            {errors.rep_address && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.rep_address}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
