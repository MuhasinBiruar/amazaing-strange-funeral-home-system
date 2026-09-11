import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { UncontractedDeceased } from 'shared';
import { createPackage } from '@/services/packageService';
import { createContract } from '@/services/contractService';
import emptyToNull from '@/utils/emptyToNull';
import { formatDate, titleCase } from '../../table/format';
import { fieldClass, labelClass } from './fieldStyles';
import DetailRow from './detailRow';
import PackageSection from './packageSection';
import {
  initialPackageDraft,
  toCreatePackageQuery,
  type PackageDraft,
} from './packageSection/types';

const PANEL_TRANSITION_MS = 300 as const;

/** `<input type="date">` wants `yyyy-mm-dd` in the viewer's local time. */
function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

interface ContractForm {
  signeddate: string;
  burialdatedeadline: string;
  totalamount: string;
  embalmingperiod: string;
  inclusions: string;
}

function initialForm(): ContractForm {
  return {
    signeddate: toDateInputValue(new Date()),
    burialdatedeadline: '',
    totalamount: '',
    embalmingperiod: '',
    inclusions: '',
  };
}

/**
 * Slide-in panel showing the selected deceased record's details alongside the
 * form that creates their contract.
 *
 * @remarks
 * Every field the panel displays already arrived with the picker row, so
 * selecting a record needs no follow-up request.
 *
 * There is no catalog of packages to pick from — a contract's package is
 * always built fresh in {@link PackageSection}, either via a flat form or a
 * guided wizard. Submitting creates that package first (`POST /packages`),
 * then the contract with the returned `packageid`.
 *
 * The parent keys this component by `caseid`, so picking a different record
 * remounts it and the form state re-initialises on its own. No reset effect.
 */
export default function ContractPanel({
  deceased,
  onClose,
  onCreated,
}: {
  deceased: UncontractedDeceased;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [packageDraft, setPackageDraft] =
    useState<PackageDraft>(initialPackageDraft);
  const [packageConfirmed, setPackageConfirmed] = useState(false);
  const [form, setForm] = useState<ContractForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // A conditionally mounted element has no previous style to transition from,
  // so the open class has to land on a later frame than the mount.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  /** Plays the close transition before unmounting. */
  function handleClose() {
    setShown(false);
    setTimeout(onClose, PANEL_TRANSITION_MS);
  }

  /**
   * Confirming the package prefills the contract's own amount, embalming
   * period and inclusions from it. All three stay editable — the package is a
   * starting point, not a lock.
   */
  function handlePackageConfirmed() {
    setPackageConfirmed(true);
    setForm((prev) => ({
      ...prev,
      totalamount: packageDraft.price,
      embalmingperiod: packageDraft.embalmingperiod,
      inclusions: packageDraft.inclusions,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const packageQuery = toCreatePackageQuery(packageDraft);
    if (!packageQuery) {
      setErrorMsg('Finish setting up the package first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { packageid } = await createPackage(packageQuery);

      await createContract({
        caseid: deceased.caseid,
        packageid,
        signeddate: new Date(form.signeddate),
        burialdatedeadline: new Date(form.burialdatedeadline),
        totalamount: Number(form.totalamount),
        embalmingperiod: Number(form.embalmingperiod),
        inclusions: emptyToNull(form.inclusions),
      });

      onCreated();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Could not create the contract. Try again.',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`New contract for ${deceased.deceased_name}`}
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-112 bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-semibold px-2 py-0.5 rounded mb-1.5">
              NEW CONTRACT
            </span>
            <h2 className="text-lg font-serif font-bold text-gray-900 wrap-break-word">
              {deceased.deceased_name}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Case #{deceased.caseid}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Deceased details
              </h3>
              <dl className="divide-y divide-gray-100">
                <DetailRow
                  label="Service status"
                  value={titleCase(deceased.servicestatus)}
                />
                <DetailRow label="Plan type" value={deceased.plantype} />
                <DetailRow
                  label="Matured life plan"
                  value={deceased.hasmaturedlifeplan ? 'Yes' : 'No'}
                />
                <DetailRow
                  label="Cause of death"
                  value={deceased.causeofdeath}
                />
                <DetailRow label="Type of death" value={deceased.typeofdeath} />
                <DetailRow
                  label="Physical description"
                  value={deceased.physicaldescription}
                />
                <DetailRow
                  label="Representative"
                  value={deceased.representative_name}
                />
                <DetailRow
                  label="Contact number"
                  value={deceased.representative_contact}
                />
                <DetailRow
                  label="Managed by"
                  value={deceased.managed_by_name}
                />
                <DetailRow
                  label="Date created"
                  value={formatDate(deceased.datecreated)}
                />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Contract
              </h3>

              <div>
                <label className={labelClass}>Package</label>
                <PackageSection
                  draft={packageDraft}
                  setDraft={setPackageDraft}
                  confirmed={packageConfirmed}
                  onConfirm={handlePackageConfirmed}
                  onEdit={() => setPackageConfirmed(false)}
                />
                {packageConfirmed && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Amount, embalming period and inclusions below were
                    prefilled from it — feel free to adjust for this contract.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="signeddate" className={labelClass}>
                    Signed date
                  </label>
                  <input
                    id="signeddate"
                    type="date"
                    required
                    value={form.signeddate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        signeddate: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="burialdatedeadline" className={labelClass}>
                    Burial deadline
                  </label>
                  <input
                    id="burialdatedeadline"
                    type="date"
                    required
                    value={form.burialdatedeadline}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        burialdatedeadline: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="totalamount" className={labelClass}>
                    Total amount (PHP)
                  </label>
                  <input
                    id="totalamount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.totalamount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        totalamount: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="embalmingperiod" className={labelClass}>
                    Embalming period (days)
                  </label>
                  <input
                    id="embalmingperiod"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.embalmingperiod}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        embalmingperiod: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inclusions" className={labelClass}>
                  Inclusions{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="inclusions"
                  rows={3}
                  value={form.inclusions}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, inclusions: e.target.value }))
                  }
                  className={`${fieldClass} resize-y`}
                />
              </div>
            </section>
          </div>

          <footer className="px-5 py-4 border-t border-gray-200 shrink-0 space-y-3">
            {errorMsg && (
              <p role="alert" className="text-sm text-red-500">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !packageConfirmed}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create contract'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}
