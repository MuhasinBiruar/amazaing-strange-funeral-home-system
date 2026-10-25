import { useEffect, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { DocumentWithUrl } from 'shared';
import {
  createDocumentRequirement,
  removeDocumentRequirement,
  uploadDocument,
} from '@/services/documentService';
import { fieldClass, labelClass } from '@/components/formStyles';
import LoadingButton from '@/components/loadingButton';
import SidePanel from '@/components/sidePanel';
import { useSidePanel } from '@/components/sidePanel/useSidePanel';
import {
  ACCEPTED_TYPES,
  FILE_INPUT_CLASS,
  errorMessage,
  getFileValidationError,
  normalizeType,
} from './utils';

/** The one row currently doing network work; everything else is disabled. */
type Busy = { type: string; action: 'upload' | 'remove' } | null;

/**
 * Lists the case's outstanding document requirements so files can be
 * submitted for them, and lets staff add or remove requirements.
 *
 * @remarks
 * Mount only while open (like every `SidePanel` user); `requestClose` plays the
 * exit transition and then calls `onClose`.
 *
 * Rendered through a portal because the case detail panel is itself a
 * `transition-transform` element, which would otherwise make this panel's
 * `fixed` positioning relative to it instead of the viewport.
 */
export default function MissingDocsPanel({
  caseid,
  documents,
  missingDocuments,
  onClose,
  onUploaded,
  onRequirementCreated,
  onRequirementRemoved,
}: {
  caseid: number;
  documents: DocumentWithUrl[];
  missingDocuments: DocumentWithUrl[];
  onClose: () => void;
  onUploaded: (document: DocumentWithUrl) => void;
  onRequirementCreated: (document: DocumentWithUrl) => void;
  onRequirementRemoved: (documentid: number) => void;
}) {
  const { isShown, requestClose } = useSidePanel(onClose);
  const [newRequirement, setNewRequirement] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  // No dependency array on purpose: `requestClose` isn't memoized.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') requestClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  async function addRequirement() {
    const type = newRequirement.trim();
    if (!type || isAdding) return;

    if (
      documents.some(
        (d) => normalizeType(d.documenttype) === normalizeType(type),
      )
    ) {
      setError('A document with this name already exists.');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      onRequirementCreated(await createDocumentRequirement(caseid, type));
      setNewRequirement('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to add requirement.'));
    } finally {
      setIsAdding(false);
    }
  }

  async function removeRequirement(doc: DocumentWithUrl) {
    setBusy({ type: doc.documenttype, action: 'remove' });
    setError(null);

    try {
      await removeDocumentRequirement(doc.documentid);
      onRequirementRemoved(doc.documentid);
    } catch (err) {
      setError(errorMessage(err, 'Failed to remove requirement.'));
    } finally {
      setBusy(null);
    }
  }

  /** Throws on failure so the row can show the error next to its own file. */
  async function upload(type: string, file: File) {
    setBusy({ type, action: 'upload' });

    try {
      onUploaded(await uploadDocument(caseid, type, file));
    } finally {
      setBusy(null);
    }
  }

  return createPortal(
    <SidePanel
      shown={isShown}
      onRequestClose={requestClose}
      ariaLabel="Submit missing documents"
      title="Submit missing documents"
      subtitle="Select a file for each document you want to submit."
    >
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-3">
          <label htmlFor="new-document-requirement" className={labelClass}>
            Add a required document
          </label>
          <div className="flex gap-2">
            <input
              id="new-document-requirement"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                void addRequirement();
              }}
              placeholder="Enter document name"
              className={fieldClass}
              disabled={isAdding}
            />
            <button
              type="button"
              onClick={() => void addRequirement()}
              disabled={!newRequirement.trim() || isAdding}
              aria-label="Add required document"
              className="shrink-0 rounded-md bg-indigo-600 px-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {missingDocuments.length === 0 ? (
          <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            No outstanding document requirements.
          </p>
        ) : (
          missingDocuments.map((doc) => (
            <MissingDocRow
              key={doc.documenttype}
              doc={doc}
              busy={busy}
              onUpload={(file) => upload(doc.documenttype, file)}
              onRemove={() => void removeRequirement(doc)}
            />
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-gray-200 px-5 py-3 text-xs text-gray-400">
        Maximum file size: 20MB · images and PDFs only
      </div>
    </SidePanel>,
    document.body,
  );
}

function MissingDocRow({
  doc,
  busy,
  onUpload,
  onRemove,
}: {
  doc: DocumentWithUrl;
  busy: Busy;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const type = doc.documenttype;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isBusy = busy !== null;

  function handleSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    e.target.value = ''; // allow re-picking the same file after removing it
    if (!selected) return;

    const validationError = getFileValidationError(selected);
    setError(validationError);
    setFile(validationError ? null : selected);
  }

  async function submit() {
    if (!file) return;
    setError(null);

    try {
      await onUpload(file);
    } catch (err) {
      setError(errorMessage(err, 'Failed to upload document.'));
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <p className="flex-1 text-sm font-medium text-gray-900">{type}</p>
        <button
          type="button"
          onClick={onRemove}
          disabled={isBusy}
          aria-label={`Remove ${type} requirement`}
          className="text-gray-400 hover:text-red-600 disabled:opacity-50 cursor-pointer"
        >
          {busy?.type === type && busy.action === 'remove' ? (
            <span className="text-[10px]">Removing...</span>
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>

      {file ? (
        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            disabled={isBusy}
            aria-label={`Remove selected ${type} file`}
            className="shrink-0 text-gray-400 hover:text-red-600 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept={ACCEPTED_TYPES}
          disabled={isBusy}
          onChange={handleSelected}
          aria-label={`Choose ${type} file`}
          className={FILE_INPUT_CLASS}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <LoadingButton
        type="button"
        disabled={!file || isBusy}
        isLoading={busy?.type === type && busy.action === 'upload'}
        onClick={submit}
        icon={Upload}
        iconSize={14}
        label="Submit document"
        loadingLabel="Submitting..."
        className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      />
    </div>
  );
}
