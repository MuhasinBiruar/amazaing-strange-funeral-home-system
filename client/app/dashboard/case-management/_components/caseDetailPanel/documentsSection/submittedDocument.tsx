import { formatDate, titleCase } from '@/utils/format';
import type { DocumentWithUrl } from 'shared';
import { isPdf, STATUS_STYLES } from './utils';
import { FileText } from 'lucide-react';

export default function SubmittedDocument({
  doc,
  onExpandImage,
}: {
  doc: DocumentWithUrl;
  onExpandImage: (image: { url: string; alt: string }) => void;
}) {
  const { url } = doc;

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
    </div>
  );
}
