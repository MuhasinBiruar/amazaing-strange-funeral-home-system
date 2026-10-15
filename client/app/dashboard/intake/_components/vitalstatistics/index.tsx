import { User, Calendar } from 'lucide-react';
import { useRef } from 'react';

export default function VitalStatistics({
  data,
  onChange,
  errors = {},
}: {
  data: Record<string, string | undefined>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-4 text-gray-900">
        <User size={20} />
        <h2 className="text-lg font-bold">Vital Statistics</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            FIRST NAME
          </label>
          <input
            id="firstname"
            type="text"
            value={data.firstname || ''}
            onChange={(e) => onChange('firstname', e.target.value)}
            className="w-full bg-gray-50 text-gray-900 border \
            border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
            focus:border-indigo-500 in-disabled:cursor-not-allowed"
            placeholder="First Name"
          />
          {errors.firstname && (
            <p className="text-red-700 text-xs font-bold mt-1">
              {errors.firstname}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            MIDDLE NAME
          </label>
          <input
            type="text"
            value={data.middlename || ''}
            onChange={(e) => onChange('middlename', e.target.value)}
            className="w-full bg-gray-50 text-gray-900 border \
            border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
            focus:border-indigo-500 in-disabled:cursor-not-allowed"
            placeholder="Middle Name"
          />
          {errors.middlename && (
            <p className="text-red-700 text-xs font-bold mt-1">
              {errors.middlename}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            LAST NAME
          </label>
          <input
            id="lastname"
            type="text"
            value={data.lastname || ''}
            onChange={(e) => onChange('lastname', e.target.value)}
            className="w-full bg-gray-50 text-gray-900 border \
            border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
            focus:border-indigo-500 in-disabled:cursor-not-allowed"
            placeholder="Last Name"
          />
          {errors.lastname && (
            <p className="text-red-700 text-xs font-bold mt-1">
              {errors.lastname}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            DATE OF DEATH
          </label>
          <div
            className="relative"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <Calendar
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              id="dateofdeath"
              ref={dateInputRef}
              type="date"
              max="2099-12-31"
              value={data.dateofdeath || ''}
              onChange={(e) => onChange('dateofdeath', e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 pl-10 text-sm \
              focus:ring-indigo-500 focus:border-indigo-500 \
              [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer in-disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            LOCATION OF DEATH
          </label>
          <input
            id="locationOfDeath"
            type="text"
            value={data.locationOfDeath || ''}
            onChange={(e) => onChange('locationOfDeath', e.target.value)}
            className="w-full bg-gray-50 text-gray-900 border \
            border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
            focus:border-indigo-500 in-disabled:cursor-not-allowed"
            placeholder="Location of death"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            TYPE OF DEATH
          </label>
          <select
            id="typeofdeath"
            value={data.typeofdeath || ''}
            onChange={(e) => {
              const value = e.target.value;
              onChange('typeofdeath', value);
              if (value !== 'Other') onChange('otherTypeOfDeath', '');
            }}
            className="w-full bg-gray-50 text-gray-900 border \
            border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 \
            focus:border-indigo-500 in-disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="Natural">Natural</option>
            <option value="Accident">Accident</option>
            <option value="Homicide">Homicide</option>
            <option value="Suicide">Suicide</option>
            <option value="Unknown">Unknown</option>
            <option value="Other">Other</option>
          </select>
          {data.typeofdeath === 'Other' && (
            <input
              id="otherTypeOfDeath"
              type="text"
              value={data.otherTypeOfDeath || ''}
              onChange={(e) => onChange('otherTypeOfDeath', e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border \
              border-gray-200 rounded-lg p-2.5 text-sm mt-2 \
              focus:ring-indigo-500 focus:border-indigo-500 in-disabled:cursor-not-allowed"
              placeholder="Specify type of death"
            />
          )}
          {errors.otherTypeOfDeath && (
            <p className="text-red-700 text-xs font-bold mt-1">
              {errors.otherTypeOfDeath}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            IMMEDIATE CAUSE OF DEATH
          </label>
          <textarea
            id="causeofdeath"
            value={data.causeofdeath || ''}
            onChange={(e) => onChange('causeofdeath', e.target.value)}
            className="w-full bg-gray-50 text-gray-900 border \
            border-gray-200 rounded-lg p-2.5 text-sm min-h-20 in-disabled:cursor-not-allowed"
            placeholder="As stated in the medical certificate or preliminary report..."
          />
        </div>
      </div>
    </section>
  );
}
