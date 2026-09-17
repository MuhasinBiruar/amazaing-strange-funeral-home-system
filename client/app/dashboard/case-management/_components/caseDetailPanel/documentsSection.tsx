import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import type { DocumentWithUrl } from 'shared';
import { uploadDocument } from '@/services/documentService';
import { formatDate, titleCase } from '@/utils/format';
import { fieldClass, labelClass } from '../fieldStyles';

const ACCEPTED_TYPES = 'image/*,application/pdf';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // matches the bucket's own limit

function isPdf(filename: string | null) {
  return filename?.toLowerCase().endsWith('.pdf') ?? false;
}

const STATUS_STYLES: Record<DocumentWithUrl['verificationstatus'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

/**
 * Shows every document uploaded for a case — images inline (click to expand
 * full-screen), PDFs as a view/download link since there's no in-panel PDF
 * renderer — plus a form to upload more. Reuses the same upload endpoint the
 * intake page uses.
 */
export default function DocumentsSection({
  caseid,
  documents,
  onUploaded,
}: {
  caseid: number;
  documents: DocumentWithUrl[];
  onUploaded: (document: DocumentWithUrl) => void;
}) {
  const [documenttype, setDocumenttype] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    if (!expandedImage) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpandedImage(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage]);

  function handleFileSelected(fileList: FileList | null) {
    const selected = fileList?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    const isAllowed =
      selected.type.startsWith('image/') || selected.type === 'application/pdf';
    if (!isAllowed) {
      setError('Only images and PDF files are accepted.');
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError('File is larger than 20MB.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  }

  async function handleUpload() {
    if (!documenttype.trim() || !file) return;

    setIsUploading(true);
    setError(null);

    try {
      const created = await uploadDocument(caseid, documenttype.trim(), file);
      onUploaded(created);
      setDocumenttype('');
      setFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload document.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Documents
        </h3>

        {documents.length === 0 && (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        )}

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.documentid}
              className="rounded-md border border-gray-200 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.documenttype}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(doc.uploaddate)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLES[doc.verificationstatus]}`}
                >
                  {titleCase(doc.verificationstatus)}
                </span>
              </div>

              {!doc.url && (
                <p className="text-xs text-gray-400">File unavailable.</p>
              )}

              {doc.url && isPdf(doc.filename) && (
                <div className="flex items-center gap-3 text-xs">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <FileText size={13} /> View PDF
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Download
                  </a>
                </div>
              )}

              {doc.url && !isPdf(doc.filename) && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedImage({ url: doc.url!, alt: doc.documenttype })
                  }
                  className="cursor-zoom-in"
                  aria-label={`Expand ${doc.documenttype}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.url}
                    alt={doc.documenttype}
                    className="max-h-40 rounded border border-gray-100 object-contain hover:opacity-90 transition"
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-md border border-dashed border-gray-300 p-3 space-y-2">
          <label className={labelClass}>Add a document</label>
          <input
            value={documenttype}
            onChange={(e) => setDocumenttype(e.target.value)}
            placeholder="e.g. Death Certificate"
            className={fieldClass}
          />
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(e) => handleFileSelected(e.target.files)}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="button"
            disabled={!documenttype.trim() || !file || isUploading}
            onClick={handleUpload}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </section>

      {expandedImage &&
        createPortal(
          // Rendered to document.body: the panel's <aside> is `transition-transform`,
          // which creates a containing block for `fixed` descendants — nested here,
          // this would only fill the panel's own width, not the real viewport.
          <div
            role="dialog"
            aria-modal="true"
            aria-label={expandedImage.alt}
            onClick={() => setExpandedImage(null)}
            className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setExpandedImage(null)}
              aria-label="Close"
              className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer"
            >
              <X size={28} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImage.url}
              alt={expandedImage.alt}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain cursor-default"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
