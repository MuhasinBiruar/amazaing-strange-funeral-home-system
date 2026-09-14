import {
  documentWithUrlSchema,
  getDocumentsResponseSchema,
  type DocumentWithUrl,
} from 'shared';
import { API } from './api';

const UPLOAD_TIMEOUT_MS = 60000 as const;

/** Fetches every document uploaded for a case. */
export async function getDocumentsByCase(
  caseid: number,
  signal?: AbortSignal,
): Promise<DocumentWithUrl[]> {
  const result = await API.get('/documents', {
    params: { caseid },
    signal,
  });

  return getDocumentsResponseSchema.parse(result.data).data;
}

/**
 * Uploads a document file for a case.
 *
 * @remarks
 * `Content-Type` is explicitly unset so the browser computes the multipart
 * boundary itself — the API instance's default `application/json` header
 * would otherwise override it and the server couldn't parse the body.
 */
export async function uploadDocument(
  caseid: number,
  documenttype: string,
  file: File,
): Promise<DocumentWithUrl> {
  const formData = new FormData();
  formData.append('caseid', String(caseid));
  formData.append('documenttype', documenttype);
  formData.append('file', file);

  const result = await API.post('/documents', formData, {
    headers: { 'Content-Type': undefined },
    timeout: UPLOAD_TIMEOUT_MS,
  });

  return documentWithUrlSchema.parse(result.data.data);
}
