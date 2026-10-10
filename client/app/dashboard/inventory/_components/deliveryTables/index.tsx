import z from 'zod';
import CasketDeliveryTable from './casketDeliveryTable';
import FormalinDeliveryTable from './formalinDeliveryTable';

export const deliveryTypeEnum = z.enum(['casket', 'formalin']).catch('casket');
export type DeliveryType = z.infer<typeof deliveryTypeEnum>;

const TYPES: { key: DeliveryType; label: string }[] = [
  { key: 'casket', label: 'Casket' },
  { key: 'formalin', label: 'Formalin' },
];

/**
 * Delivery logs, one table per item type, switched with the same tab strip
 * the financials page uses for its Direct / LGU / Life Plan logs.
 */
export default function DeliveryTables({
  type,
  onTypeChange,
}: {
  type: DeliveryType;
  onTypeChange: (type: DeliveryType) => void;
}) {
  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="flex border-b border-gray-200 px-2">
          {TYPES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onTypeChange(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                type === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {type === 'casket' ? <CasketDeliveryTable /> : <FormalinDeliveryTable />}
    </>
  );
}
