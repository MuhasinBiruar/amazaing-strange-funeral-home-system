import { useState } from 'react';
import { formatDate, titleCase } from '@/utils/format';
import type { DocumentWithUrl } from 'shared';
import { errorMessage, isPdf, STATUS_STYLES } from './utils';
import { Check, FileText, Loader2, RotateCcw, X } from 'lucide-react';
import { updateDocumentVerification } from '@/services/documentService';

type VerificationStatus = DocumentWithUrl['verificationstatus'];

export default function SubmittedDocument({
  doc,
  onExpandImage,
  onVerificationChanged,
}: {
  doc: DocumentWithUrl;
  onExpandImage: (image: { url: string; alt: string }) => void;
  /** Called after this document is approved, rejected, or reset. */
  onVerificationChanged: () => void;
}) {
  const { url } = doc;
  const [savingStatus, setSavingStatus] = useState<VerificationStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: VerificationStatus) {
    setSavingStatus(status);
    setError(null);
    try {
      await updateDocumentVerification(doc.documentid, status);
      onVerificationChanged();
    } catch (err) {
      setError(errorMessage(err, 'Could not update this document.'));
    } finally {
      setSavingStatus(null);
    }
  }

  const isSaving = savingStatus !== null;

  return (
    <div className="rounded-md border border-gray-200 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {doc.documenttype}
          </p>
          <p className="text-xs text-gray-400">{formatDate(doc.uploaddate)}</p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLES[doc.verificationstatus]}`}
        >
          {titleCase(doc.verificationstatus)}
        </span>
      </div>

      {!url && <p className="text-xs text-gray-400">File unavailable.</p>}

      {url && isPdf(doc.filename) && (
        <div className="flex items-center gap-3 text-xs">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <FileText size={13} /> View PDF
          </a>
          <a href={url} download className="text-gray-500 hover:text-gray-700">
            Download
          </a>
        </div>
      )}

      {url && !isPdf(doc.filename) && (
        <button
          type="button"
          onClick={() => onExpandImage({ url, alt: doc.documenttype })}
          className="cursor-zoom-in"
          aria-label={`Expand ${doc.documenttype}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={doc.documenttype}
            className="max-h-40 rounded border border-gray-100 object-contain hover:opacity-90 transition"
          />
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {doc.verificationstatus === 'pending' ? (
          <>
            <button
              type="button"
              onClick={() => void setStatus('verified')}
              disabled={isSaving}
              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingStatus === 'verified' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Approve
            </button>
            <button
              type="button"
              onClick={() => void setStatus('rejected')}
              disabled={isSaving}
              className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingStatus === 'rejected' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Reject
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-500">
              {doc.verificationstatus === 'verified'
                ? 'Approved.'
                : 'Rejected. Upload a new file under Missing documents.'}
            </span>
            <button
              type="button"
              onClick={() => void setStatus('pending')}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingStatus === 'pending' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
              Undo
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
