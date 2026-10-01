import {
  type GetLguCasesQuery,
  getLguCasesResponseSchema,
  type CreateLguCaseQuery,
} from 'shared';
import { API } from './api';

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

export async function createLguCase(data: CreateLguCaseQuery) {
  const result = await API.post('/lgucases', data, {
    withCredentials: true,
  });
  return result.data;
}
