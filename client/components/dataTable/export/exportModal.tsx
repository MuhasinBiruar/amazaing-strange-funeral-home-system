'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, FileText, X } from 'lucide-react';
import LoadingButton from '@/components/loadingButton';
import {
  downloadFile,
  exportFileName,
  toCsv,
  type ExportTable,
} from './exportUtils';

type ExportFormat = 'csv' | 'pdf';

const FORMATS: {
  key: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    key: 'csv',
    label: 'CSV',
    description: 'Opens in Excel or Google Sheets.',
    icon: FileSpreadsheet,
  },
  {
    key: 'pdf',
    label: 'PDF',
    description: 'Ready to print or share.',
    icon: FileText,
  },
];

/**
 * Lets the user download a table as CSV or PDF.
 *
 * @param total How many rows match the table's current search and filters,
 * i.e. how many the export will contain.
 * @param loadTable Fetches every matching row (not just the page on screen)
 * and flattens it to text.
 */
export default function ExportModal({
  title,
  fileName,
  total,
  loadTable,
  onClose,
}: {
  title: string;
  fileName: string;
  total: number;
  loadTable: () => Promise<ExportTable>;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const table = await loadTable();
      if (format === 'csv') {
        downloadFile(
          new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }),
          exportFileName(fileName, 'csv'),
        );
      } else {
        const { toPdfBlob } = await import('./exportPdf');
        downloadFile(
          await toPdfBlob(title, table),
          exportFileName(fileName, 'pdf'),
        );
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Could not export. Try again.');
      setIsExporting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Export ${title}`}
        className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Export {title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              All {total} {total === 1 ? 'record' : 'records'} matching the
              current search and filters.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FORMATS.map(({ key, label, description, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormat(key)}
              aria-pressed={format === key}
              disabled={isExporting}
              className={`rounded-lg border p-3 text-left transition cursor-pointer disabled:cursor-not-allowed ${
                format === key
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                className={format === key ? 'text-indigo-600' : 'text-gray-400'}
              />
              <span className="block mt-2 text-sm font-semibold text-gray-900">
                {label}
              </span>
              <span className="block text-xs text-gray-500">{description}</span>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <LoadingButton
            type="button"
            onClick={handleExport}
            isLoading={isExporting}
            label={`Export ${format.toUpperCase()}`}
            loadingLabel="Exporting..."
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
