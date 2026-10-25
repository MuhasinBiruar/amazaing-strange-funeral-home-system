import {
  deceasedRecordSchema,
  getDeceasedRecordResponseSchema,
  getUncontractedDeceasedResponseSchema,
  type CreateDeceasedRecordQuery,
  type GetUncontractedDeceasedQuery,
  type UpdateDeceasedRecordQuery,
} from 'shared';
import { API } from './api';
import { isAxiosError } from 'axios';
import { extractErrorMessage } from './utils/extractErrorMessage';

export async function getUncontractedDeceased({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  status,
  caseid,
  signal,
}: GetUncontractedDeceasedQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (caseid !== undefined) params.append('caseid', String(caseid));

  const result = await API.get(`/deceasedrecords/without-contract?${params}`, {
    withCredentials: true,
    signal: signal,
  });
  return getUncontractedDeceasedResponseSchema.parse(result.data);
}

export async function createDeceasedRecord(payload: CreateDeceasedRecordQuery) {
  try {
    const res = await API.post('/deceasedrecords', payload);

    return deceasedRecordSchema.parse(res.data.data);
  } catch (error) {
    console.error('Error creating deceased record:', error);
    throw error;
  }
}

export async function getDeceasedRecord(id: number) {
  try {
    const response = await API.get(`/deceasedrecords/${id}`);

    return getDeceasedRecordResponseSchema.parse(response.data).data;
  } catch (error) {
    console.error('Error fetching deceased record:', error);
    throw error;
  }
}

export async function updateDeceasedRecord(
  caseid: number,
  payload: UpdateDeceasedRecordQuery,
) {
  try {
    const response = await API.patch(`/deceasedrecords/${caseid}`, payload);

    return getDeceasedRecordResponseSchema.parse(response.data).data;
  } catch (err) {
    if (isAxiosError(err)) {
      const msg = err.response?.data?.error?.message;
      if (typeof msg === 'string') throw new Error(msg);
    }

    throw err;
  }
}

export async function deleteDeceasedRecord(caseid: number) {
  try {
    const res = await API.delete(`/deceasedrecords/${caseid}`);

    return deceasedRecordSchema.parse(res.data.data);
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.message)
      throw new Error(extractErrorMessage(err.response.data));

    console.error('Error deleting deceased record:', err);
    throw err;
  }
}
