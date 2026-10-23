'use client';

import { useState } from 'react';
import { createLguQuerySchema } from 'shared';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import LoadingButton from '@/components/loadingButton';
import { fieldClass, labelClass } from '@/components/formStyles';
import { createLgu } from '@/services/lgusService';

/** Slide-in panel for adding an LGU, so it can be picked during intake. */
export default function CreateLguPanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);

  const [lguname, setLguname] = useState('');
  const [contactinfo, setContactinfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const result = createLguQuerySchema.safeParse({ lguname, contactinfo });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await createLgu(result.data);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Failed to add LGU.');
      return;
    }

    onSuccess();
  }

  return (
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Add LGU"
      badge="NEW LGU"
      title="Add LGU"
      subtitle="Added LGUs can be selected for LGU cases during intake."
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label htmlFor="lgu-name" className={labelClass}>
              LGU name
            </label>
            <input
              id="lgu-name"
              type="text"
              required
              autoFocus
              value={lguname}
              onChange={(e) => setLguname(e.target.value)}
              placeholder="e.g., Quezon City"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="lgu-contactinfo" className={labelClass}>
              Contact info (optional)
            </label>
            <input
              id="lgu-contactinfo"
              type="text"
              value={contactinfo}
              onChange={(e) => setContactinfo(e.target.value)}
              placeholder="e.g., CSWDO, 8988-4242"
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
              label="Add LGU"
              loadingLabel="Saving..."
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </footer>
      </form>
    </SidePanel>
  );
}
