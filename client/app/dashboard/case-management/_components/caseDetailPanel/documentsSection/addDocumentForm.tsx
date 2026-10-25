import { useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import type { DocumentWithUrl } from 'shared';
import { uploadDocument } from '@/services/documentService';
import { fieldClass, labelClass } from '@/components/formStyles';
import LoadingButton from '@/components/loadingButton';
import {
  ACCEPTED_TYPES,
  FILE_INPUT_CLASS,
  errorMessage,
  getFileValidationError,
} from './utils';

/** Uploads a one-off document of any type for the case. */
export default function AddDocumentForm({
  caseid,
  onUploaded,
}: {
  caseid: number;
  onUploaded: (document: DocumentWithUrl) => void;
}) {
  const [documenttype, setDocumenttype] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    const validationError = selected && getFileValidationError(selected);

    setError(validationError);
    setFile(validationError ? null : selected);
  }

  async function handleUpload() {
    if (!documenttype.trim() || !file) return;

    setIsUploading(true);
    setError(null);

    try {
      onUploaded(await uploadDocument(caseid, documenttype.trim(), file));
      setDocumenttype('');
      setFile(null);
    } catch (err) {
      setError(errorMessage(err, 'Failed to upload document.'));
    } finally {
      setIsUploading(false);
    }
  }

  return (
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
        onChange={handleFileSelected}
        className={FILE_INPUT_CLASS}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <LoadingButton
        type="button"
        disabled={!documenttype.trim() || !file}
        isLoading={isUploading}
        onClick={handleUpload}
        icon={Upload}
        iconSize={14}
        label="Upload"
        loadingLabel="Uploading..."
        className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      />
    </div>
  );
}
