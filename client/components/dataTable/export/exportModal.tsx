'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, FileText, X } from 'lucide-react';
import LoadingButton from '@/components/loadingButton';
import DateRangePicker from '@/components/dateRangePicker';
import type { DateRangeValue } from '../types';
import {
  downloadFile,
  exportFileName,
  toCsv,
  type ExportOptions,
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

const sectionLabelClass =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

/**
 * Lets the user download a table as CSV or PDF, choosing the format, which
 * rows (the page on screen or every match), a date range for this export
 * only, and which columns.
 *
 * @param total How many rows match the table's current search and filters.
 * @param pageCount How many rows are on screen.
 * @param dateFilter The table's date filter and its current value; omitted
 * for tables without one, which hides the date range option.
 * @param loadTable Fetches the chosen rows and flattens them to text.
 */
export default function ExportModal({
  title,
  fileName,
  total,
  pageCount,
  columns,
  dateFilter,
  loadTable,
  onClose,
}: {
  title: string;
  fileName: string;
  total: number;
  pageCount: number;
  columns: { key: string; label: string }[];
  dateFilter?: { label: string; value: DateRangeValue };
  loadTable: (options: ExportOptions) => Promise<ExportTable>;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportOptions['scope']>('all');
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    dateFilter?.value ?? { from: null, to: null },
  );
  const [columnKeys, setColumnKeys] = useState(() => columns.map((c) => c.key));
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateChanged =
    dateFilter !== undefined &&
    (dateRange.from !== dateFilter.value.from ||
      dateRange.to !== dateFilter.value.to);

  function toggleColumn(key: string) {
    setColumnKeys((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : // Keep the table's column order, whatever order they're ticked in.
          columns
            .map((c) => c.key)
            .filter((k) => k === key || prev.includes(k)),
    );
  }

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const table = await loadTable({
        scope,
        columnKeys,
        dateRange: dateFilter && scope === 'all' ? dateRange : undefined,
      });
      if (table.rows.length === 0) {
        setError('No records match. Try a different date range.');
        setIsExporting(false);
        return;
      }

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
        className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start p-6 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Export {title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Uses the table&apos;s current search and filters.
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

        <div className="px-6 space-y-5 overflow-y-auto">
          <div>
            <span className={sectionLabelClass}>Format</span>
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
                    className={
                      format === key ? 'text-indigo-600' : 'text-gray-400'
                    }
                  />
                  <span className="block mt-2 text-sm font-semibold text-gray-900">
                    {label}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <fieldset disabled={isExporting}>
            <legend className={sectionLabelClass}>Rows</legend>
            <div className="space-y-1.5">
              {(
                [
                  {
                    key: 'all',
                    label: 'All matching records',
                    hint: dateChanged
                      ? 'in the date range below'
                      : `${total} ${total === 1 ? 'record' : 'records'}`,
                  },
                  {
                    key: 'page',
                    label: 'This page only',
                    hint: `${pageCount} ${pageCount === 1 ? 'record' : 'records'} on screen`,
                  },
                ] as const
              ).map(({ key, label, hint }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="export-scope"
                    checked={scope === key}
                    onChange={() => setScope(key)}
                    className="accent-indigo-600"
                  />
                  {label}
                  <span className="text-xs text-gray-400">({hint})</span>
                </label>
              ))}
            </div>
          </fieldset>

          {dateFilter && scope === 'all' && (
            <div>
              <span className={sectionLabelClass}>Date range</span>
              <DateRangePicker
                value={dateRange}
                placeholder={dateFilter.label}
                onApply={(from, to) => setDateRange({ from, to })}
                onClear={() => setDateRange({ from: null, to: null })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Applies to this export only; the table isn&apos;t changed.
              </p>
            </div>
          )}

          <fieldset disabled={isExporting}>
            <div className="flex items-center justify-between mb-1.5">
              <legend className={`${sectionLabelClass} mb-0!`}>
                Columns ({columnKeys.length}/{columns.length})
              </legend>
              <button
                type="button"
                onClick={() =>
                  setColumnKeys(
                    columnKeys.length === columns.length
                      ? []
                      : columns.map((c) => c.key),
                  )
                }
                className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                {columnKeys.length === columns.length
                  ? 'Clear all'
                  : 'Select all'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={columnKeys.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="accent-indigo-600"
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 p-6 pt-5">
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
            disabled={columnKeys.length === 0}
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
