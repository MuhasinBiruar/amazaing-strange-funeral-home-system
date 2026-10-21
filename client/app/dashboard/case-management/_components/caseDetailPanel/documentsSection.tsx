import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Plus, Trash2, Upload, X } from 'lucide-react';
import type { DocumentWithUrl } from 'shared';
import {
  createDocumentRequirement,
  removeDocumentRequirement,
  uploadDocument,
} from '@/services/documentService';
import { formatDate, titleCase } from '@/utils/format';
import { fieldClass, labelClass } from '@/components/formStyles';
import LoadingButton from '@/components/loadingButton';

const ACCEPTED_TYPES = 'image/*,application/pdf';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // matches the bucket's own limit

function isPdf(filename: string | null) {
  return filename?.toLowerCase().endsWith('.pdf') ?? false;
}

function getFileValidationError(file: File) {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    return 'Only images and PDF files are accepted.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is larger than 20MB.';
  }

  return null;
}

const STATUS_STYLES: Record<DocumentWithUrl['verificationstatus'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

/**
 * Shows every document uploaded for a case.
 */
export default function DocumentsSection({
  caseid,
  documents,
  onUploaded,
  onRequirementCreated,
  onRequirementRemoved,
}: {
  caseid: number;
  documents: DocumentWithUrl[];
  onUploaded: (document: DocumentWithUrl) => void;
  onRequirementCreated: (document: DocumentWithUrl) => void;
  onRequirementRemoved: (documentid: number) => void;
}) {
  const [documenttype, setDocumenttype] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMissingDocsPanelOpen, setIsMissingDocsPanelOpen] = useState(false);
  const [selectedMissingFiles, setSelectedMissingFiles] = useState<
    Record<string, File | null>
  >({});
  const [uploadingMissingDocument, setUploadingMissingDocument] = useState<
    string | null
  >(null);
  const [missingDocumentError, setMissingDocumentError] = useState<
    Record<string, string>
  >({});
  const [newRequirement, setNewRequirement] = useState('');
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  const [requirementError, setRequirementError] = useState<string | null>(null);
  const [removingRequirementId, setRemovingRequirementId] = useState<
    number | null
  >(null);
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const uploadedDocumentTypes = new Set(
    documents
      .filter((doc) => doc.filename !== null)
      .map((doc) => doc.documenttype.trim().toLowerCase()),
  );
  const seenMissingTypes = new Set<string>();
  const missingDocuments = documents.filter((doc) => {
    const normalizedType = doc.documenttype.trim().toLowerCase();
    if (
      doc.filename !== null ||
      uploadedDocumentTypes.has(normalizedType) ||
      seenMissingTypes.has(normalizedType)
    ) {
      return false;
    }

    seenMissingTypes.add(normalizedType);
    return true;
  });
  const submittedDocuments = documents.filter((doc) => doc.filename !== null);
  const hasMissingDocuments = missingDocuments.length > 0;

  useEffect(() => {
    if (!expandedImage && !isMissingDocsPanelOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setExpandedImage(null);
        setIsMissingDocsPanelOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage, isMissingDocsPanelOpen]);

  function handleFileSelected(fileList: FileList | null) {
    const selected = fileList?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    const validationError = getFileValidationError(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  }

  function handleMissingFileSelected(
    documenttype: string,
    fileList: FileList | null,
  ) {
    const selected = fileList?.[0] ?? null;
    if (!selected) return;

    const validationError = getFileValidationError(selected);
    if (validationError) {
      setMissingDocumentError((prev) => ({
        ...prev,
        [documenttype]: validationError,
      }));
      setSelectedMissingFiles((prev) => ({ ...prev, [documenttype]: null }));
      return;
    }

    setMissingDocumentError((prev) => {
      const next = { ...prev };
      delete next[documenttype];
      return next;
    });
    setSelectedMissingFiles((prev) => ({ ...prev, [documenttype]: selected }));
  }

  function handleRemoveMissingFile(documenttype: string) {
    setSelectedMissingFiles((prev) => ({ ...prev, [documenttype]: null }));
    setMissingDocumentError((prev) => {
      const next = { ...prev };
      delete next[documenttype];
      return next;
    });
  }

  async function handleAddRequirement() {
    const type = newRequirement.trim();
    if (!type || isAddingRequirement) return;

    const normalizedType = type.toLowerCase();
    if (
      documents.some(
        (doc) => doc.documenttype.trim().toLowerCase() === normalizedType,
      )
    ) {
      setRequirementError('A document with this name already exists.');
      return;
    }

    setIsAddingRequirement(true);
    setRequirementError(null);

    try {
      const created = await createDocumentRequirement(caseid, type);
      onRequirementCreated(created);
      setNewRequirement('');
    } catch (err) {
      setRequirementError(
        err instanceof Error ? err.message : 'Failed to add requirement.',
      );
    } finally {
      setIsAddingRequirement(false);
    }
  }

  async function handleDeleteRequirement(document: DocumentWithUrl) {
    if (removingRequirementId !== null) return;

    setRemovingRequirementId(document.documentid);
    setRequirementError(null);
    try {
      await removeDocumentRequirement(document.documentid);
      onRequirementRemoved(document.documentid);
      handleRemoveMissingFile(document.documenttype);
    } catch (err) {
      setRequirementError(
        err instanceof Error ? err.message : 'Failed to remove requirement.',
      );
    } finally {
      setRemovingRequirementId(null);
    }
  }

  async function handleMissingDocumentUpload(documenttype: string) {
    const selected = selectedMissingFiles[documenttype];
    if (!selected || uploadingMissingDocument) return;

    setUploadingMissingDocument(documenttype);
    setMissingDocumentError((prev) => {
      const next = { ...prev };
      delete next[documenttype];
      return next;
    });

    try {
      const created = await uploadDocument(caseid, documenttype, selected);
      onUploaded(created);
      handleRemoveMissingFile(documenttype);
    } catch (err) {
      setMissingDocumentError((prev) => ({
        ...prev,
        [documenttype]:
          err instanceof Error ? err.message : 'Failed to upload document.',
      }));
    } finally {
      setUploadingMissingDocument(null);
    }
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

        <button
          type="button"
          onClick={() => setIsMissingDocsPanelOpen(true)}
          className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition cursor-pointer ${
            hasMissingDocuments
              ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
              : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
          }`}
          aria-label={`View ${missingDocuments.length} missing documents`}
        >
          <span>
            <span className="block text-sm font-medium text-gray-900">
              Missing documents
            </span>
            <span className="block text-xs text-gray-500">
              {missingDocuments.length === 0
                ? 'No outstanding document requirements.'
                : `${missingDocuments.length} ${missingDocuments.length === 1 ? 'document' : 'documents'} still needed`}
            </span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              hasMissingDocuments
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {missingDocuments.length}
          </span>
        </button>

        {submittedDocuments.length === 0 && (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        )}

        <div className="space-y-3">
          {submittedDocuments.map((doc) => (
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
      </section>

      {isMissingDocsPanelOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-100 flex justify-end bg-black/40"
            onClick={() => setIsMissingDocsPanelOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="missing-documents-title"
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2
                    id="missing-documents-title"
                    className="text-base font-semibold text-gray-900"
                  >
                    Submit missing documents
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a file for each document you want to submit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMissingDocsPanelOpen(false)}
                  aria-label="Close missing documents panel"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-3">
                  <label
                    htmlFor="new-document-requirement"
                    className={labelClass}
                  >
                    Add a required document
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="new-document-requirement"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddRequirement();
                        }
                      }}
                      placeholder="Enter document name"
                      className={fieldClass}
                      disabled={isAddingRequirement}
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddRequirement()}
                      disabled={!newRequirement.trim() || isAddingRequirement}
                      aria-label="Add required document"
                      className="shrink-0 rounded-md bg-indigo-600 px-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                {requirementError && (
                  <p className="text-xs text-red-500">{requirementError}</p>
                )}

                {missingDocuments.length === 0 ? (
                  <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                    No outstanding document requirements.
                  </p>
                ) : (
                  missingDocuments.map((doc) => {
                    const type = doc.documenttype;
                    const selected = selectedMissingFiles[type] ?? null;
                    const isUploadingThis = uploadingMissingDocument === type;

                    return (
                      <div
                        key={type}
                        className="space-y-2 rounded-md border border-gray-200 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <p className="flex-1 text-sm font-medium text-gray-900">
                            {type}
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRequirement(doc)}
                            disabled={
                              removingRequirementId !== null ||
                              uploadingMissingDocument !== null
                            }
                            aria-label={`Remove ${type} requirement`}
                            className="text-gray-400 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                          >
                            {removingRequirementId === doc.documentid ? (
                              <span className="text-[10px]">Removing...</span>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                        {selected ? (
                          <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                            <span className="truncate">{selected.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMissingFile(type)}
                              disabled={uploadingMissingDocument !== null}
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
                            disabled={uploadingMissingDocument !== null}
                            onChange={(e) => {
                              handleMissingFileSelected(type, e.target.files);
                              e.currentTarget.value = '';
                            }}
                            aria-label={`Choose ${type} file`}
                            className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                          />
                        )}
                        {missingDocumentError[type] && (
                          <p className="text-xs text-red-500">
                            {missingDocumentError[type]}
                          </p>
                        )}
                        <LoadingButton
                          type="button"
                          disabled={
                            !selected ||
                            uploadingMissingDocument !== null ||
                            removingRequirementId !== null
                          }
                          isLoading={isUploadingThis}
                          onClick={() => handleMissingDocumentUpload(type)}
                          icon={Upload}
                          iconSize={14}
                          label="Submit document"
                          loadingLabel="Submitting..."
                          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-400">
                Maximum file size: 20MB · images and PDFs only
              </div>
            </section>
          </div>,
          document.body,
        )}

      {expandedImage &&
        createPortal(
          // Rendered to document.body: the panel's <aside> is `transition-transform`,
          // which creates a containing block for `fixed` descendants - nested here,
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
