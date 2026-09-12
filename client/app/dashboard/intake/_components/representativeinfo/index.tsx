import { User, MapPin } from 'lucide-react';

interface RepresentativeInfoProps {
  data: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export default function RepresentativeInfo({
  data,
  onChange,
  errors = {},
}: RepresentativeInfoProps) {
  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-4 text-gray-900">
        <User size={20} />
        <h2 className="text-lg font-bold">Representative Information</h2>
      </div>

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
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              MIDDLE NAME
            </label>
            <input
              type="text"
              value={data.rep_middlename || ''}
              onChange={(e) => onChange('rep_middlename', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Middle Name"
            />
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
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Spouse, Child, Sibling"
            />
            {errors.rep_relationship && (
              <p className="text-red-700 text-xs font-bold mt-1">
                {errors.rep_relationship}
              </p>
            )}
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
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-20"
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
    </section>
  );
}
