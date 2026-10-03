import {
  type GetLguCasesQuery,
  getLguCasesResponseSchema,
  type UpdateLguCaseQuery,
} from 'shared';
import { API } from './api';
import axios from 'axios';
import { extractErrorMessage } from './utils/extractErrorMessage';

export async function getLguCases({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: GetLguCasesQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/lgucases?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLguCasesResponseSchema.parse(result.data);
}

export async function updateLguCase(
  lgucaseid: number,
  payload: UpdateLguCaseQuery,
) {
  try {
    const result = await API.patch(`/lgucases/${lgucaseid}`, payload, {
      withCredentials: true,
    });
    return result.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error updating LGU case:', error);
    throw error;
  }
}
