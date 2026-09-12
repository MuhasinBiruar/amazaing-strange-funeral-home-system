import { useState } from 'react';
import { Upload, Trash2, CheckCircle2 } from 'lucide-react';
import ConfirmModal from '../confirmmodal';

interface DocumentItem {
  name: string;
  uploaded: boolean;
}

const REQUIRED_DOCUMENTS = [
  'Death Certificate',
  'Release Paper',
  'Burial Permit',
  'Valid ID',
];

export default function DocumentChecklist() {
  const [documents, setDocuments] = useState<DocumentItem[]>(
    REQUIRED_DOCUMENTS.map((name, i) => ({ name, uploaded: i === 0 })), // first one starts "uploaded" to match your mock
  );
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const documentProgress = Math.round(
    (documents.filter((d) => d.uploaded).length / documents.length) * 100,
  );

  const handleUpload = (name: string) => {
    // TODO: actual file storage not implemented yet — marks as uploaded for now
    setDocuments((prev) =>
      prev.map((d) => (d.name === name ? { ...d, uploaded: true } : d)),
    );
  };

  const handleDeleteConfirmed = () => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.name === fileToDelete ? { ...d, uploaded: false } : d,
      ),
    );
    setFileToDelete(null);
  };

  return (
    <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Document Checklist</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
          {documents.length} REQUIRED
        </span>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.name}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {doc.uploaded ? (
                <CheckCircle2 className="text-indigo-900" size={20} />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {doc.name}
              </span>
            </div>

            {doc.uploaded ? (
              <button
                onClick={() => setFileToDelete(doc.name)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <button
                onClick={() => handleUpload(doc.name)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-indigo-600"
              >
                <Upload size={14} />
                UPLOAD
              </button>
            )}
          </div>
        ))}

        <p className="text-[10px] text-gray-400 text-right">
          Max file size: 2MB per document
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>PROGRESS</span>
          <span>{documentProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-indigo-900 h-1.5 rounded-full"
            style={{ width: `${documentProgress}%` }}
          ></div>
        </div>
      </div>

      {fileToDelete && (
        <ConfirmModal
          title="Are you sure?"
          message="The following files will be moved to the trash. They will be permanently deleted after 30 days."
          items={[fileToDelete]}
          confirmLabel="Delete File"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setFileToDelete(null)}
        />
      )}
    </section>
  );
}
