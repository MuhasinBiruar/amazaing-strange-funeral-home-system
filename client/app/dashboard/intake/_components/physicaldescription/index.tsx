import { FileText } from 'lucide-react';

interface PhysicalDescriptionProps {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export default function PhysicalDescription({
  data,
  onChange,
}: PhysicalDescriptionProps) {
  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-4 text-gray-900">
        <FileText size={20} />
        <h2 className="text-lg font-bold">Physical Description</h2>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          DETAILED DESCRIPTION
        </label>
        <textarea
          value={(data.physicaldescription as string | undefined) || ''}
          onChange={(e) => onChange('physicaldescription', e.target.value)}
          className="w-full bg-gray-50 text-gray-900 border \
          placeholder:text-gray-400 border-gray-200 rounded-lg p-2.5 \
          text-sm min-h-30 in-disabled:cursor-not-allowed"
          placeholder="Include estimated height/weight, identifying marks (tattoos, scars), and clothing worn at intake..."
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={data.hasadvanceddecomposition === true}
          onChange={(e) =>
            onChange('hasadvanceddecomposition', e.target.checked)
          }
          className="mt-0.5 accent-indigo-600"
        />
        <span>
          Advanced decomposition or open wounds
          <span className="block text-xs text-gray-500">
            Notifies inventory staff to expect elevated formalin usage.
          </span>
        </span>
      </label>
    </section>
  );
}
