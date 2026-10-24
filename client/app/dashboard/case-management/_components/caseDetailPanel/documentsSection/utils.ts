import type { DocumentWithUrl } from 'shared';

export const ACCEPTED_TYPES = 'image/*,application/pdf';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // matches the bucket's own limit

export const FILE_INPUT_CLASS =
  'block w-full text-xs text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200 cursor-pointer';

export const STATUS_STYLES: Record<
  DocumentWithUrl['verificationstatus'],
  string
> = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export const normalizeType = (type: string) => type.trim().toLowerCase();

export const isPdf = (filename: string | null) =>
  filename?.toLowerCase().endsWith('.pdf') ?? false;

export const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function getFileValidationError(file: File) {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf')
    return 'Only images and PDF files are accepted.';

  if (file.size > MAX_FILE_SIZE_BYTES) return 'File is larger than 20MB.';

  return null;
}
