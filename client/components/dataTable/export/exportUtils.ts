import { isValidElement, type ReactNode } from 'react';
import type { DataTableColumn } from '../types';

/** A table flattened to plain text, ready to write as CSV or PDF. */
export interface ExportTable {
  headers: string[];
  rows: string[][];
}

/** The text a user would read inside a rendered cell. */
function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToText(node.props.children);
  }
  return '';
}

/**
 * Turns rows into plain text using the table's own columns, so an export
 * reads the same as the table on screen.
 */
export function toExportTable<T, K extends string>(
  columns: DataTableColumn<T, K>[],
  rows: T[],
): ExportTable {
  const exported = columns.filter((col) => col.exportable !== false);

  return {
    headers: exported.map((col) => col.label),
    rows: rows.map((row) =>
      exported.map((col) =>
        col.exportValue
          ? String(col.exportValue(row) ?? '')
          : nodeToText(col.render(row)).trim(),
      ),
    ),
  };
}

/** UTF-8 byte order mark (built from its code so the source stays plain ASCII). */
const BOM = String.fromCharCode(0xfeff);

function escapeCsvCell(value: string) {
  return /[",\r\n]/.test(value) || value !== value.trim()
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

/**
 * CSV text with a UTF-8 byte order mark, so Excel shows characters like "₱"
 * correctly when the file is double-clicked.
 */
export function toCsv({ headers, rows }: ExportTable) {
  const lines = [headers, ...rows].map((cells) =>
    cells.map(escapeCsvCell).join(','),
  );
  return `${BOM}${lines.join('\r\n')}`;
}

/** Saves a file through the browser's normal download flow. */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** `<base>-yyyy-mm-dd.<extension>` in the viewer's local date. */
export function exportFileName(base: string, extension: 'csv' | 'pdf') {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const date = new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  return `${base}-${date}.${extension}`;
}
