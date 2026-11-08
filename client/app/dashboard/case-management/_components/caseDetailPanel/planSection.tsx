import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  updateCasePlanQuerySchema,
  type CasePlan,
  type UpdateCasePlanQuery,
} from 'shared';
import { fieldClass, labelClass } from '@/components/formStyles';
import LoadingButton from '@/components/loadingButton';
import CompanySearchSelect from '@/components/companySearchSelect';
import LguSearchSelect from '@/components/lguSearchSelect';
import { getCasePlan, updateCasePlan } from '@/services/deceasedRecordService';

type PlanType = CasePlan['plantype'];
type ReimbursementStatus = NonNullable<
  CasePlan['lgucase']
>['reimbursementstatus'];

/** Inputs as typed; parsed into an `UpdateCasePlanQuery` on save. */
interface PlanForm {
  plantype: PlanType;
  companyid: number | null;
  companyname: string | null;
  plannumber: string;
  planholdername: string;
  totalamount: string;
  use_benefits: boolean;
  lguid: number | null;
  lguname: string | null;
  reimbursementstatus: ReimbursementStatus;
  reimbursementamount: string;
}

function toPlanForm(plan: CasePlan, deceasedName: string): PlanForm {
  const lp = plan.lifeplan;
  const lg = plan.lgucase;
  return {
    plantype: plan.plantype,
    companyid: lp?.companyid ?? null,
    companyname: lp?.companyname ?? null,
    plannumber: lp?.plannumber ?? '',
    // Intake defaults the holder to the deceased.
    planholdername: lp?.planholdername ?? deceasedName,
    totalamount: lp?.totalamount != null ? String(lp.totalamount) : '',
    use_benefits: lp?.use_benefits ?? true,
    lguid: lg?.lguid ?? null,
    lguname: lg?.lguname ?? null,
    reimbursementstatus: lg?.reimbursementstatus ?? 'pending',
    reimbursementamount:
      lg?.reimbursementamount != null ? String(lg.reimbursementamount) : '',
  };
}

/** Empty inputs become `undefined` so the schema reports them as required. */
const toNumber = (value: string) =>
  value.trim() === '' ? undefined : Number(value);

function toPayload(form: PlanForm): unknown {
  if (form.plantype === 'Life') {
    return {
      plantype: 'Life',
      lifeplan: {
        companyid: form.companyid ?? undefined,
        plannumber: form.plannumber,
        planholdername: form.planholdername,
        totalamount: toNumber(form.totalamount),
        use_benefits: form.use_benefits,
      },
    };
  }
  if (form.plantype === 'LGU') {
    return {
      plantype: 'LGU',
      lgucase: {
        lguid: form.lguid ?? undefined,
        reimbursementstatus: form.reimbursementstatus,
        reimbursementamount: toNumber(form.reimbursementamount),
      },
    };
  }
  return { plantype: 'Direct' };
}

/**
 * The case's plan type and, for Life and LGU, the same details intake asks
 * for. Saved separately from the deceased details because switching plans
 * also adds or removes the case's life plan / LGU record.
 */
export default function PlanSection({
  caseid,
  deceasedName,
  onSaved,
}: {
  caseid: number;
  deceasedName: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PlanForm | null>(null);
  const [savedPlanType, setSavedPlanType] = useState<PlanType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // `deceasedName` only seeds the holder name when the plan first loads.
  const [initialDeceasedName] = useState(deceasedName);

  useEffect(() => {
    const controller = new AbortController();

    getCasePlan(caseid, controller.signal)
      .then((plan) => {
        setForm(toPlanForm(plan, initialDeceasedName));
        setSavedPlanType(plan.plantype);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load plan:', error);
        setLoadError('Could not load the plan details.');
      });

    return () => controller.abort();
  }, [caseid, initialDeceasedName]);

  function update<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setIsSaved(false);
  }

  async function handleSave() {
    if (!form) return;

    const parsed = updateCasePlanQuerySchema.safeParse(toPayload(form));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path.at(-1));
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    setSaveError(null);
    setIsSaved(false);

    try {
      const plan = await updateCasePlan(
        caseid,
        parsed.data satisfies UpdateCasePlanQuery,
      );
      setForm(toPlanForm(plan, initialDeceasedName));
      setSavedPlanType(plan.plantype);
      setIsSaved(true);
      onSaved();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save the plan. Try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const fieldError = (field: string) =>
    errors[field] && (
      <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
    );

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Plan
      </h3>

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!form && !loadError && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Loading plan...
        </div>
      )}

      {form && (
        <>
          <div>
            <label className={labelClass}>Plan type</label>
            <select
              value={form.plantype}
              onChange={(e) => update('plantype', e.target.value as PlanType)}
              className={`${fieldClass} cursor-pointer`}
            >
              <option value="Direct">Direct</option>
              <option value="Life">Life Plan</option>
              <option value="LGU">LGU</option>
            </select>
          </div>

          {form.plantype === 'Life' && (
            <>
              <div>
                <CompanySearchSelect
                  companyid={form.companyid}
                  companyname={form.companyname}
                  onChange={(company) => {
                    update('companyid', company.companyid);
                    update('companyname', company.companyname);
                  }}
                  error={errors.companyid}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Plan number</label>
                  <input
                    value={form.plannumber}
                    onChange={(e) => update('plannumber', e.target.value)}
                    placeholder="e.g., PL-6768420"
                    className={fieldClass}
                  />
                  {fieldError('plannumber')}
                </div>
                <div>
                  <label className={labelClass}>Total amount (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalamount}
                    onChange={(e) => update('totalamount', e.target.value)}
                    placeholder="e.g., 18000"
                    className={fieldClass}
                  />
                  {fieldError('totalamount')}
                </div>
              </div>

              <div>
                <label className={labelClass}>Plan holder name</label>
                <input
                  value={form.planholdername}
                  onChange={(e) => update('planholdername', e.target.value)}
                  className={fieldClass}
                />
                {fieldError('planholdername')}
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.use_benefits}
                  onChange={(e) => update('use_benefits', e.target.checked)}
                  className="mt-0.5 cursor-pointer"
                />
                <span>
                  Use life plan casket/benefits
                  <span className="block text-xs text-gray-500">
                    Clear this if the representative will upgrade to a package
                    above the plan&apos;s covered amount.
                  </span>
                </span>
              </label>
            </>
          )}

          {form.plantype === 'LGU' && (
            <>
              <div>
                <LguSearchSelect
                  lguid={form.lguid}
                  lguname={form.lguname}
                  onChange={(lgu) => {
                    update('lguid', lgu.lguid);
                    update('lguname', lgu.lguname);
                  }}
                  error={errors.lguid}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Reimbursement status</label>
                  <select
                    value={form.reimbursementstatus}
                    onChange={(e) =>
                      update(
                        'reimbursementstatus',
                        e.target.value as ReimbursementStatus,
                      )
                    }
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="released">Released</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Reimbursement amount (PHP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.reimbursementamount}
                    onChange={(e) =>
                      update('reimbursementamount', e.target.value)
                    }
                    placeholder="e.g., 15000"
                    className={fieldClass}
                  />
                  {fieldError('reimbursementamount')}
                </div>
              </div>
            </>
          )}

          {savedPlanType && form.plantype !== savedPlanType && (
            <p className="text-xs text-amber-700">
              {savedPlanType !== 'Direct' &&
                `Saving removes this case's ${savedPlanType === 'Life' ? 'life plan' : 'LGU'} record. `}
              A contract that&apos;s already made keeps its current total.
            </p>
          )}

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          {isSaved && !saveError && (
            <p className="text-xs text-emerald-600">Saved.</p>
          )}

          <LoadingButton
            type="button"
            isLoading={isSaving}
            onClick={handleSave}
            label="Save plan"
            loadingLabel="Saving..."
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
        </>
      )}
    </section>
  );
}
