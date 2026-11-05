import { useState } from 'react';
import type { DocumentWithUrl } from 'shared';
import AddDocumentForm from './addDocumentForm';
import MissingDocsPanel from './missingDocsPanel';
import ImageLightbox from '@/components/imageLightbox';
import SubmittedDocument from './submittedDocument';
import { normalizeType } from './utils';

/**
 * Shows every document uploaded for a case, with entry points for uploading
 * a new one and for handling the outstanding requirements.
 */
export default function DocumentsSection({
  caseid,
  documents,
  onUploaded,
  onRequirementCreated,
  onRequirementRemoved,
  onVerificationChanged,
}: {
  caseid: number;
  documents: DocumentWithUrl[];
  onUploaded: (document: DocumentWithUrl) => void;
  onRequirementCreated: (document: DocumentWithUrl) => void;
  onRequirementRemoved: (documentid: number) => void;
  /** A document was approved, rejected, or reset to pending. */
  onVerificationChanged: () => void;
}) {
  const [isMissingDocsOpen, setIsMissingOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const missingDocuments = getMissingDocuments(documents);
  const hasMissing = missingDocuments.length > 0;
  const submitted = documents.filter((doc) => doc.filename !== null);

  return (
    <>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Documents
        </h3>

        <button
          type="button"
          onClick={() => setIsMissingOpen(true)}
          className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition cursor-pointer ${
            hasMissing
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
              {hasMissing
                ? `${missingDocuments.length} ${missingDocuments.length === 1 ? 'document' : 'documents'} still needed`
                : 'No outstanding document requirements.'}
            </span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              hasMissing
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {missingDocuments.length}
          </span>
        </button>

        {submitted.length === 0 && (
          <p className="text-sm text-gray-400">No documents uploaded yet.</p>
        )}

        <div className="space-y-3">
          {submitted.map((doc) => (
            <SubmittedDocument
              key={doc.documentid}
              doc={doc}
              onExpandImage={setExpandedImage}
              onVerificationChanged={onVerificationChanged}
            />
          ))}
        </div>

        <AddDocumentForm caseid={caseid} onUploaded={onUploaded} />
      </section>

      {isMissingDocsOpen && (
        <MissingDocsPanel
          caseid={caseid}
          documents={documents}
          missingDocuments={missingDocuments}
          onClose={() => setIsMissingOpen(false)}
          onUploaded={onUploaded}
          onRequirementCreated={onRequirementCreated}
          onRequirementRemoved={onRequirementRemoved}
        />
      )}

      {expandedImage && (
        <ImageLightbox
          imageUrl={expandedImage.url}
          imageAlt={expandedImage.alt}
          onClose={() => setExpandedImage(null)}
        />
      )}
    </>
  );
}

function getMissingDocuments(documents: DocumentWithUrl[]) {
  // A rejected file doesn't cover its type; the requirement placeholder the
  // rejection re-added shows as missing until a new file is uploaded.
  const submitted = new Set(
    documents
      .filter((d) => d.filename !== null && d.verificationstatus !== 'rejected')
      .map((d) => normalizeType(d.documenttype)),
  );
  const seen = new Set<string>();

  return documents.filter((d) => {
    const key = normalizeType(d.documenttype);
    if (d.filename !== null || submitted.has(key) || seen.has(key))
      return false;

    seen.add(key);
    return true;
  });
}
