import { useRef, useState } from 'react';
import { Upload, Trash2, CheckCircle2, Plus, X } from 'lucide-react';

export interface StagedDocument {
  documenttype: string;
  file: File | null;
}

// Just a sensible starting point — the checklist itself is fully editable
// below, not a fixed list the system enforces.
const DEFAULT_REQUIRED_DOCUMENTS = [
  'Death Certificate',
  'Release Paper',
  'Burial Permit',
  'Valid ID',
];

// Mirrors the documents bucket's own limits (see server/src/middleware/upload.ts).
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/*,application/pdf';

export function initialStagedDocuments(): StagedDocument[] {
  return DEFAULT_REQUIRED_DOCUMENTS.map((documenttype) => ({
    documenttype,
    file: null,
  }));
}

/**
 * Lets staff pick a file per required document, and manage the list of
 * required documents itself — it starts from a sensible default, but who's
 * running intake decides what's actually required for this case, not a
 * hardcoded list.
 *
 * Files are held as plain `File` objects in the parent's state — not part of
 * the draft `formData`, since `useDraft` JSON-serialises that to localStorage
 * and `File` objects can't survive that. They're actually uploaded (to S3,
 * via the documents endpoint) only once the deceased record exists and has a
 * `caseid`, which happens later in `useSubmitIntake`.
 */
export default function DocumentChecklist({
  documents,
  onChange,
}: {
  documents: StagedDocument[];
  onChange: (documents: StagedDocument[]) => void;
}) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [newRequirement, setNewRequirement] = useState('');

  const stagedCount = documents.filter((d) => d.file !== null).length;
  const progress =
    documents.length === 0
      ? 0
      : Math.round((stagedCount / documents.length) * 100);

  function handleFileSelected(documenttype: string, fileList: FileList | null) {
    const file = fileList?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`${file.name} is larger than 20MB — choose a smaller file.`);
      return;
    }

    const isAllowed =
      file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isAllowed) {
      alert('Only images and PDF files are accepted.');
      return;
    }

    onChange(
      documents.map((d) =>
        d.documenttype === documenttype ? { ...d, file } : d,
      ),
    );
  }

  function handleRemoveFile(documenttype: string) {
    onChange(
      documents.map((d) =>
        d.documenttype === documenttype ? { ...d, file: null } : d,
      ),
    );

    const input = fileInputRefs.current[documenttype];
    if (input) input.value = '';
  }

  function handleRemoveRequirement(documenttype: string) {
    onChange(documents.filter((d) => d.documenttype !== documenttype));
  }

  function handleAddRequirement() {
    const name = newRequirement.trim();
    if (!name) return;

    const alreadyExists = documents.some(
      (d) => d.documenttype.toLowerCase() === name.toLowerCase(),
    );
    if (alreadyExists) {
      alert(`"${name}" is already on the checklist.`);
      return;
    }

    onChange([...documents, { documenttype: name, file: null }]);
    setNewRequirement('');
  }

  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Document Checklist</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
          {documents.length} REQUIRED
        </span>
      </div>

      <div className="space-y-3">
        {documents.length === 0 && (
          <p className="text-sm text-gray-400">
            No documents required yet — add one below.
          </p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.documenttype}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 gap-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              {doc.file ? (
                <CheckCircle2 className="text-indigo-900 shrink-0" size={20} />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded shrink-0"></div>
              )}
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-900 block">
                  {doc.documenttype}
                </span>
                {doc.file && (
                  <span className="text-xs text-gray-500 truncate block">
                    {doc.file.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {doc.file ? (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(doc.documenttype)}
                  className="text-gray-400 not-disabled:hover:text-red-500 transition in-disabled:cursor-not-allowed"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <label
                  className="flex items-center gap-1 text-xs font-semibold \
                  text-gray-600 in-enabled:hover:text-indigo-600 \
                  cursor-pointer in-disabled:cursor-not-allowed"
                >
                  <Upload size={14} />
                  UPLOAD
                  <input
                    ref={(el) => {
                      fileInputRefs.current[doc.documenttype] = el;
                    }}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={(e) =>
                      handleFileSelected(doc.documenttype, e.target.files)
                    }
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => handleRemoveRequirement(doc.documenttype)}
                className="text-gray-300 not-disabled:hover:text-red-500 \
                transition in-disabled:cursor-not-allowed"
                title="Remove requirement"
                aria-label={`Remove ${doc.documenttype} from the checklist`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <input
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRequirement();
              }
            }}
            placeholder="Add a required document..."
            className="flex-1 text-sm border border-gray-200 rounded-md \
            px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 \
            focus:ring-indigo-400 focus:border-indigo-400 in-disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleAddRequirement}
            disabled={!newRequirement.trim()}
            className="flex items-center gap-1 text-xs font-semibold \
            text-indigo-600 hover:text-indigo-700 \
            disabled:text-gray-300 cursor-pointer shrink-0 in-disabled:cursor-not-allowed"
          >
            <Plus size={14} /> ADD
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-right">
          Max file size: 20MB per document · images and PDFs only
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>PROGRESS</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-indigo-900 h-1.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
}
