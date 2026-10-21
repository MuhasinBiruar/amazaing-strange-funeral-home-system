'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  createCasketDeliveryQuerySchema,
  createFormalinDeliveryQuerySchema,
  type CasketInventory,
  type FormalinInventory,
} from 'shared';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import CasketSelector from './casketSelector';
import { getFormalinInventory } from '@/services/formalinInventoryService';
import {
  createCasketDelivery,
  createFormalinDelivery,
} from '@/services/deliveryService';
import { formatCurrency } from '@/utils/format';
import type { DeliveryType } from '.';

/** `<input type="date">` wants `yyyy-mm-dd` in the viewer's local time. */
function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

const formatLiters = (value: number) =>
  `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} L`;

/**
 * Slide-in panel for recording an incoming casket or formalin delivery, which
 * also adds the quantity received to stock.
 *
 * @param onSaved Called after a successful save with the server's low-stock
 * warning, if stock is still at or below its minimum.
 */
export default function RecordDeliveryPanel({
  type,
  onClose,
  onSaved,
}: {
  type: DeliveryType;
  onClose: () => void;
  onSaved: (warning: string | null) => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  // Casket stock is loaded by `CasketSelector`; only formalin is loaded here.
  const [formalin, setFormalin] = useState<FormalinInventory | null>(null);
  const [isLoadingFormalin, setIsLoadingFormalin] = useState(
    type === 'formalin',
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCasket, setSelectedCasket] = useState<CasketInventory | null>(
    null,
  );
  const [quantity, setQuantity] = useState('');
  const [totalPaid, setTotalPaid] = useState('');
  const [deliverydate, setDeliverydate] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (type !== 'formalin') return;

    const controller = new AbortController();
    getFormalinInventory(controller.signal)
      .then(setFormalin)
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load formalin stock:', err);
        setLoadError(
          'Could not load formalin stock. Close the panel and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingFormalin(false);
      });

    return () => controller.abort();
  }, [type]);

  const quantityNumber = Number(quantity);
  const totalPaidNumber = Number(totalPaid);
  const hasQuantity = quantity !== '' && quantityNumber > 0;
  const unitCost =
    hasQuantity && totalPaid !== '' ? totalPaidNumber / quantityNumber : null;

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const common = {
      quantityreceived: quantityNumber,
      deliverydate,
      totalamountpaid: totalPaidNumber,
    };

    let save: () => Promise<{ warning: string | null }>;
    if (type === 'casket') {
      const result = createCasketDeliveryQuerySchema.safeParse({
        ...common,
        casketid: selectedCasket?.casketid,
      });
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      save = () => createCasketDelivery(result.data);
    } else {
      const result = createFormalinDeliveryQuerySchema.safeParse(common);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      save = () => createFormalinDelivery(result.data);
    }

    setIsSaving(true);
    try {
      const { warning } = await save();
      onSaved(warning);
    } catch (err) {
      setIsSaving(false);
      setError(
        err instanceof Error ? err.message : 'Failed to record delivery.',
      );
    }
  }

  const noun = type === 'casket' ? 'Casket' : 'Formalin';

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`Record ${noun.toLowerCase()} delivery`}
      badge="NEW DELIVERY"
      badgeClassName="bg-orange-100 text-orange-800"
      title={`Record ${noun} Delivery`}
      subtitle="The quantity received is added to stock."
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {type === 'casket' ? (
            <div>
              <CasketSelector
                selected={selectedCasket}
                onChange={setSelectedCasket}
              />
              {selectedCasket && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">
                    {selectedCasket.caskettype}
                  </span>{' '}
                  stock: {selectedCasket.currentstock}
                  {hasQuantity && Number.isInteger(quantityNumber) && (
                    <>
                      {' → '}
                      <span className="font-medium text-gray-700">
                        {selectedCasket.currentstock + quantityNumber}
                      </span>
                    </>
                  )}{' '}
                  (minimum {selectedCasket.minimumthreshold})
                </p>
              )}
            </div>
          ) : isLoadingFormalin ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              Loading...
            </div>
          ) : loadError ? (
            <p className="text-sm text-red-600">{loadError}</p>
          ) : (
            formalin && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                Current stock:{' '}
                <span className="font-medium text-gray-900">
                  {formatLiters(formalin.currentstock)}
                </span>
                {hasQuantity && (
                  <>
                    {' → '}
                    <span className="font-medium text-gray-900">
                      {formatLiters(formalin.currentstock + quantityNumber)}
                    </span>
                  </>
                )}
                <span className="block text-xs text-gray-500 mt-0.5">
                  Minimum {formatLiters(formalin.minimumthreshold)}
                </span>
              </div>
            )
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="delivery-quantity" className={labelClass}>
                {type === 'casket' ? 'Quantity received' : 'Liters received'}
              </label>
              <input
                id="delivery-quantity"
                type="number"
                required
                min={type === 'casket' ? 1 : 0.01}
                step={type === 'casket' ? 1 : 0.01}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="delivery-date" className={labelClass}>
                Delivery date
              </label>
              <input
                id="delivery-date"
                type="date"
                required
                value={deliverydate}
                onChange={(e) => setDeliverydate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="delivery-total" className={labelClass}>
              Total amount paid (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₱
              </span>
              <input
                id="delivery-total"
                type="number"
                required
                min="0"
                step="0.01"
                value={totalPaid}
                onChange={(e) => setTotalPaid(e.target.value)}
                className={`${fieldClass} pl-7`}
              />
            </div>
            {unitCost !== null && Number.isFinite(unitCost) && (
              <p className="mt-1.5 text-xs text-gray-500">
                {formatCurrency(unitCost)}{' '}
                {type === 'casket' ? 'per casket' : 'per liter'}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <footer className="px-5 py-4 border-t border-gray-200 shrink-0">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isSaving}
              disabled={
                type === 'formalin' && (isLoadingFormalin || loadError !== null)
              }
              label="Save delivery"
              loadingLabel="Saving..."
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>
    </SidePanel>
  );
}
