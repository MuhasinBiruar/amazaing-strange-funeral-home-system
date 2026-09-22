import {
  accessPageEnum,
  getAccessPageLabel,
  type AccessPage,
  type UpdateAccessQuery,
} from 'shared';
import { labelClass } from './constants';

export default function AccessFields({
  access,
  onToggle,
}: {
  access: UpdateAccessQuery;
  onToggle: (key: AccessPage) => void;
}) {
  return (
    <div>
      <label className={`${labelClass} mb-2`}>Page access</label>
      <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}
