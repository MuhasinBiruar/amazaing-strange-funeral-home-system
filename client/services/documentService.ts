import axios from 'axios';
import {
  createDocumentRequirementSchema,
  documentResponseSchema,
  documentWithUrlSchema,
  getDocumentsResponseSchema,
  type DocumentWithUrl,
  type UpdateDocumentVerificationQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';

const UPLOAD_TIMEOUT_MS = 60000 as const;

/** Creates a pending document row with no file for a case. */
export async function createDocumentRequirement(
  caseid: number,
  documenttype: string,
): Promise<DocumentWithUrl> {
  const payload = createDocumentRequirementSchema.parse({
    caseid,
    documenttype,
  });
  const result = await API.post('/documents/requirements', payload);

  return documentWithUrlSchema.parse(result.data.data);
}

/**
 * Approves (`verified`), rejects, or resets (`pending`) an uploaded document.
 * Rejecting also re-adds that document type as a missing requirement.
 */
export async function updateDocumentVerification(
  documentid: number,
  verificationstatus: UpdateDocumentVerificationQuery['verificationstatus'],
): Promise<DocumentWithUrl> {
  try {
    const result = await API.patch(`/documents/${documentid}/verification`, {
      verificationstatus,
    });
    return documentResponseSchema.parse(result.data).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));
    throw error;
  }
}

/** Removes a requirement only while it has no submitted file. */
export async function removeDocumentRequirement(
  documentid: number,
): Promise<void> {
  await API.delete(`/documents/${documentid}`);
}

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
 * boundary itself. The API instance's default `application/json` header
 * would otherwise override it and the server will fail to parse the body.
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
