import { PACKAGE_TYPES, type PackageType } from './types';

export default function PackageTypeButtons({
  value,
  onChange,
}: {
  value: PackageType | '';
  onChange: (type: PackageType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PACKAGE_TYPES.map((type) => (
        <button
          type="button"
          key={type}
          onClick={() => onChange(type)}
          className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border transition cursor-pointer ${
            value === type
              ? 'bg-indigo-900 text-white border-indigo-900'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
