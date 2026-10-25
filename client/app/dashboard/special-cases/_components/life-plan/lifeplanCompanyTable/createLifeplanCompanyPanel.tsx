'use client';

import { useState } from 'react';
import { createLifeplanCompanyQuerySchema } from 'shared';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import { createLifeplanCompany } from '@/services/lifeplansService';

/**
 * Slide-in panel for adding a life plan company, so it can be picked during
 * intake. The life plan counterpart of `CreateLguPanel`.
 */
export default function CreateLifeplanCompanyPanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  const [companyname, setCompanyname] = useState('');
  const [contactinfo, setContactinfo] = useState('');
  const [minimumthreshold, setMinimumthreshold] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // The shared schema's own message for a missing number is generic, so
    // the blank case gets a clearer one here.
    if (minimumthreshold.trim() === '') {
      setError('Minimum threshold is required.');
      return;
    }

    const result = createLifeplanCompanyQuerySchema.safeParse({
      companyname,
      contactinfo,
      minimumthreshold: Number(minimumthreshold),
    });
    if (!result.success) {
      const issue = result.error.issues[0];
      setError(
        issue.path[0] === 'companyname'
          ? 'Company name is required.'
          : issue.path[0] === 'minimumthreshold'
            ? 'Minimum threshold must be zero or more.'
            : issue.message,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createLifeplanCompany(result.data);
    } catch (err) {
      setIsSubmitting(false);
      setError(
        err instanceof Error ? err.message : 'Failed to add life plan company.',
      );
      return;
    }

    onSuccess();
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Add life plan company"
      badge="NEW COMPANY"
      title="Add Life Plan Company"
      subtitle="Added companies can be selected for life plans during intake."
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label htmlFor="company-name" className={labelClass}>
              Company name
            </label>
            <input
              id="company-name"
              type="text"
              required
              autoFocus
              value={companyname}
              onChange={(e) => setCompanyname(e.target.value)}
              placeholder="e.g., St. Peter Life Plan"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="company-minimumthreshold" className={labelClass}>
              Minimum threshold (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₱
              </span>
              <input
                id="company-minimumthreshold"
                type="number"
                required
                min="0"
                step="0.01"
                value={minimumthreshold}
                onChange={(e) => setMinimumthreshold(e.target.value)}
                placeholder="e.g., 30000"
                className={`${fieldClass} pl-7`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="company-contactinfo" className={labelClass}>
              Contact info (optional)
            </label>
            <input
              id="company-contactinfo"
              type="text"
              value={contactinfo}
              onChange={(e) => setContactinfo(e.target.value)}
              placeholder="e.g., claims@company.com, 8123-4567"
              className={fieldClass}
            />
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
              isLoading={isSubmitting}
              label="Add company"
              loadingLabel="Saving..."
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>
    </SidePanel>
  );
}
