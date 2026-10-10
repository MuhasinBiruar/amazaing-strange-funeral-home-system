import { useState } from 'react';
import { Plus } from 'lucide-react';
import z from 'zod';
import { useInfoModal } from '@/components/infoModal/useInfoModal';
import CasketDeliveryTable from './casketDeliveryTable';
import FormalinDeliveryTable from './formalinDeliveryTable';
import RecordDeliveryPanel from './recordDeliveryPanel';

export const deliveryTypeEnum = z.enum(['casket', 'formalin']).catch('casket');
export type DeliveryType = z.infer<typeof deliveryTypeEnum>;

const TYPES: { key: DeliveryType; label: string }[] = [
  { key: 'casket', label: 'Casket' },
  { key: 'formalin', label: 'Formalin' },
];

/**
 * Delivery logs, one table per item type, switched with the same tab strip
 * the financials page uses for its Direct / LGU / Life Plan logs. "Record
 * delivery" records an incoming delivery of whichever type is showing.
 */
export default function DeliveryTables({
  type,
  onTypeChange,
}: {
  type: DeliveryType;
  onTypeChange: (type: DeliveryType) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { infoModal, showInfo } = useInfoModal();

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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsRecording(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          Record {type} delivery
        </button>
      </div>

      {type === 'casket' ? (
        <CasketDeliveryTable refreshKey={refreshKey} />
      ) : (
        <FormalinDeliveryTable refreshKey={refreshKey} />
      )}

      {isRecording && (
        <RecordDeliveryPanel
          key={type}
          type={type}
          onClose={() => setIsRecording(false)}
          onSaved={(warning) => {
            setIsRecording(false);
            setRefreshKey((k) => k + 1);
            if (warning) {
              void showInfo({
                title: 'Stock Still Low',
                message: warning,
                severity: 'warning',
              });
            }
          }}
        />
      )}

      {infoModal}
    </>
  );
}
