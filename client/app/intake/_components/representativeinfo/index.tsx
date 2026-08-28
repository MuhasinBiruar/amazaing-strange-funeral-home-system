import { User, MapPin } from 'lucide-react';

interface RepresentativeInfoProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export default function RepresentativeInfo({
  data,
  onChange,
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
              type="text"
              value={data.rep_firstname || ''}
              onChange={(e) => onChange('rep_firstname', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="First Name"
            />
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
              type="text"
              value={data.rep_lastname || ''}
              onChange={(e) => onChange('rep_lastname', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Last Name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              RELATIONSHIP
            </label>
            <input
              type="text"
              value={data.rep_relationship || ''}
              onChange={(e) => onChange('rep_relationship', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Spouse, Child, Sibling"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              CONTACT NUMBER
            </label>
            <input
              type="tel"
              value={data.rep_contactnumber || ''}
              onChange={(e) => onChange('rep_contactnumber', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., +63 912 345 6789"
            />
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
              value={data.rep_address || ''}
              onChange={(e) => onChange('rep_address', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-20"
              placeholder="House/Block/Lot No., Street, Barangay, City/Municipality, Province"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
