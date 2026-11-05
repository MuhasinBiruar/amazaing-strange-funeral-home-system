'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert, X } from 'lucide-react';
import { DELETE_ALL_CONFIRMATION, DELETION_RETENTION_DAYS } from 'shared';
import LoadingButton from '@/components/loadingButton';

/**
 * Confirms Delete all by having a superadmin type
 * {@link DELETE_ALL_CONFIRMATION} exactly (case-sensitive).
 *
 * @param onConfirm Deletes everything; throwing keeps the modal open with
 * the error shown.
 */
export default function DeleteAllModal({
  title,
  total,
  plural,
  note,
  onConfirm,
  onClose,
}: {
  title: string;
  total: number;
  plural: string;
  note?: string;
  onConfirm: (confirmation: string) => Promise<void>;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmation === DELETE_ALL_CONFIRMATION;

  async function handleDelete() {
    if (!matches) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(confirmation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete. Try again.',
      );
      setIsDeleting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Delete all ${title}`}
        className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 text-red-600">
            <TriangleAlert size={24} />
            <h3 className="text-lg font-bold text-gray-900">
              Delete all {total} {plural}?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            All {total} {plural} matching this table&apos;s current search and
            filters move to Deleted items. An admin can restore them for{' '}
            {DELETION_RETENTION_DAYS} days, after which they&apos;re permanently
            deleted.
          </p>
          {note && <p>{note}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleDelete();
          }}
        >
          <label
            htmlFor="delete-all-confirmation"
            className="block text-sm text-gray-700 mb-1.5"
          >
            Type{' '}
            <span className="font-semibold text-gray-900">
              {DELETE_ALL_CONFIRMATION}
            </span>{' '}
            to confirm.
          </label>
          <input
            id="delete-all-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={isDeleting}
            autoComplete="off"
            autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"
          />

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isDeleting}
              disabled={!matches || isDeleting}
              label="Delete all"
              loadingLabel="Deleting..."
              className="flex-1 py-2 text-sm font-bold text-white rounded-lg bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
