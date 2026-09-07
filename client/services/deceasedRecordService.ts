import {
  getUncontractedDeceasedResponseSchema,
  type GetUncontractedDeceasedQuery,
} from 'shared';
import { API } from './api';

/**
 * Fetches deceased records that do not have a contract yet — the candidates
 * shown by the "New contract" picker.
 */
export async function getUncontractedDeceased({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  status,
  signal,
}: GetUncontractedDeceasedQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const result = await API.get(`/deceasedrecords/without-contract?${params}`, {
    withCredentials: true,
    signal: signal,
  });
  return getUncontractedDeceasedResponseSchema.parse(result.data);
}

export async function getDeceasedRecord(id: number) {
  try {
    const response = await API.get(`/deceasedrecords/${id}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching deceased record:', error);
    throw error;
  }
}
