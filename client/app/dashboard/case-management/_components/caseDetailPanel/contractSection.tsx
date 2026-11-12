import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Contract } from 'shared';
import { fieldClass, labelClass } from '@/components/formStyles';
import LoadingButton from '@/components/loadingButton';
import { getContract, updateContract } from '@/services/contractService';
import { formatCurrency, formatDate } from '@/utils/format';
import { toDateInputValue } from '@/utils/toDateInputValue';

/**
 * The case's contract at a glance, with its burial deadline editable. The
 * total and package stay as agreed when the contract was made.
 */
export default function ContractSection({
  contractid,
  onSaved,
}: {
  contractid: number;
  onSaved: () => void;
}) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [deadline, setDeadline] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getContract(contractid, controller.signal)
      .then((result) => {
        setContract(result);
        setDeadline(toDateInputValue(result.burialdatedeadline));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load contract:', error);
        setLoadError('Could not load the contract.');
      });

    return () => controller.abort();
  }, [contractid]);

  const signedDate = contract ? toDateInputValue(contract.signeddate) : '';
  const isChanged =
    contract !== null &&
    deadline !== toDateInputValue(contract.burialdatedeadline);

  async function handleSave() {
    if (!deadline) {
      setSaveError('Pick a burial deadline.');
      return;
    }
    if (deadline < signedDate) {
      setSaveError("The burial deadline can't be before the signed date.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setIsSaved(false);

    try {
      const updated = await updateContract(contractid, {
        burialdatedeadline: deadline,
      });
      setContract(updated);
      setDeadline(toDateInputValue(updated.burialdatedeadline));
      setIsSaved(true);
      onSaved();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save the burial deadline. Try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Contract
      </h3>

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!contract && !loadError && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Loading contract...
        </div>
      )}

      {contract && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelClass}>Signed</p>
              <p className="text-sm text-gray-700">
                {formatDate(contract.signeddate)}
              </p>
            </div>
            <div>
              <p className={labelClass}>Total</p>
              <p className="text-sm text-gray-700">
                {formatCurrency(contract.totalamount)}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="burialdatedeadline" className={labelClass}>
              Burial deadline
            </label>
            <input
              id="burialdatedeadline"
              type="date"
              min={signedDate}
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setIsSaved(false);
                setSaveError(null);
              }}
              className={fieldClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              The service status is updated to match the new deadline.
            </p>
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          {isSaved && !saveError && (
            <p className="text-xs text-emerald-600">Saved.</p>
          )}

          <LoadingButton
            type="button"
            isLoading={isSaving}
            onClick={handleSave}
            disabled={!isChanged}
            label="Save deadline"
            loadingLabel="Saving..."
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
        </>
      )}
    </section>
  );
}
