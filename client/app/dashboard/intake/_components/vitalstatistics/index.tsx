import { User, Calendar } from 'lucide-react';
import { useRef } from 'react';

interface VitalStatisticsProps {
  locationOfDeath: string;
  setLocationOfDeath: (location: string) => void;
}

export default function VitalStatistics({
  locationOfDeath,
  setLocationOfDeath,
}: VitalStatisticsProps) {
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
            type="text"
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
            className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Last Name"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            DATE OF DEATH
          </label>
          <div
            className="relative cursor-pointer"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <Calendar
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              ref={dateInputRef}
              type="date"
              max="2099-12-31"
              onKeyDown={(e) => e.preventDefault()}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            LOCATION OF DEATH
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['House', 'Hospital', 'Police Case'].map((loc) => (
              <button
                key={loc}
                onClick={() => setLocationOfDeath(loc)}
                className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border transition ${
                  locationOfDeath === loc
                    ? 'bg-indigo-900 text-white border-indigo-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            IMMEDIATE CAUSE OF DEATH
          </label>
          <textarea
            className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm min-h-20"
            placeholder="As stated in the medical certificate or preliminary report..."
          />
        </div>
      </div>
    </section>
  );
}
