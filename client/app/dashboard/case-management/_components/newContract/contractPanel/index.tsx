import { useState } from 'react';
import type { UncontractedDeceased } from 'shared';
import { createPackage } from '@/services/packageService';
import { createContract } from '@/services/contractService';
import emptyToNull from '@/utils/emptyToNull';
import { formatDate, titleCase } from '@/utils/format';
import { fieldClass, labelClass } from '../../fieldStyles';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import DetailRow from './detailRow';
import PackageSection from './packageSection';
import type { ConfirmedPackage } from './packageSection/types';
import LoadingButton from '@/components/loadingButton';
import { useInfoModal } from '@/components/infoModal/useInfoModal';

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
 * {@link PackageSection} either builds a brand new package or guides staff to
 * an existing one by type. Submitting creates the package first if it's new
 * (`POST /packages`) — an existing pick already has a `packageid` — then the
 * contract with that id.
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
  const { isShown, requestClose } = useSidePanel(onClose);
  const { infoModal, showInfo } = useInfoModal();

  const [confirmedPackage, setConfirmedPackage] =
    useState<ConfirmedPackage | null>(null);
  const [form, setForm] = useState<ContractForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Confirming a package (new or existing) prefills the contract's own
   * amount, embalming period and inclusions from it. All three stay
   * editable — the package is a starting point, not a lock.
   */
  function handlePackageConfirmed(pkg: ConfirmedPackage) {
    setConfirmedPackage(pkg);
    setForm((prev) => ({
      ...prev,
      totalamount: String(pkg.price),
      embalmingperiod: String(pkg.embalmingperiod),
      inclusions: pkg.inclusions ?? '',
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmedPackage) {
      setErrorMsg('Finish setting up the package first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // A newly built package doesn't have an id yet - create it first. One
      // picked via the guided flow already has one; nothing to create.
      let packageid = confirmedPackage.packageid;
      if (packageid === null) {
        if (confirmedPackage.casketid === null) {
          setErrorMsg('Select a casket for the new package first.');
          setIsSubmitting(false);
          return;
        }

        const created = await createPackage({
          packagename: confirmedPackage.packagename,
          packagetype: confirmedPackage.packagetype,
          price: confirmedPackage.price,
          embalmingperiod: confirmedPackage.embalmingperiod,
          inclusions: confirmedPackage.inclusions,
          casketid: confirmedPackage.casketid,
        });
        packageid = created.packageid;
      }

      const contractResponse = await createContract({
        caseid: deceased.caseid,
        packageid,
        signeddate: new Date(form.signeddate),
        burialdatedeadline: new Date(form.burialdatedeadline),
        totalamount: Number(form.totalamount),
        embalmingperiod: Number(form.embalmingperiod),
        inclusions: emptyToNull(form.inclusions),
      });

      // Assigning the package's casket may have just brought its stock down
      // to (or below) the minimum threshold - the contract still succeeded,
      // this is a heads-up, not an error.
      if (contractResponse.casketWarning)
        await showInfo({
          title: 'Casket Warning',
          message: contractResponse.casketWarning,
          closeLabel: 'OK',
          severity: 'warning',
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
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel={`New contract for ${deceased.deceased_name}`}
      badge="NEW CONTRACT"
      badgeClassName="bg-indigo-100 text-indigo-800"
      title={deceased.deceased_name}
    >
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
              <DetailRow label="Cause of death" value={deceased.causeofdeath} />
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
              <DetailRow label="Managed by" value={deceased.managed_by_name} />
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
                confirmed={confirmedPackage}
                onConfirm={handlePackageConfirmed}
                onEdit={() => setConfirmedPackage(null)}
              />
              {confirmedPackage && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Amount, embalming period and inclusions below were prefilled
                  from it — feel free to adjust for this contract.
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
              onClick={requestClose}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              disabled={!confirmedPackage}
              label="Create contract"
              loadingLabel="Creating..."
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>

      {infoModal}
    </SidePanel>
  );
}
