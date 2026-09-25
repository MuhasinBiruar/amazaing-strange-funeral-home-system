import {
  accessPageEnum,
  getAccessPageLabel,
  type AccessPage,
  type UpdateAccessQuery,
} from 'shared';

export default function PageAccessSection({
  access,
  onToggle,
}: {
  access: UpdateAccessQuery;
  onToggle: (key: AccessPage) => void;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Page access
      </h3>

      <div className="grid grid-cols-2 gap-1.5">
        {accessPageEnum.options.map((key) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              checked={access[key]}
              onChange={() => onToggle(key)}
            />
            {getAccessPageLabel(key)}
          </label>
        ))}
      </div>
    </section>
  );
}
