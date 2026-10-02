import { type GetLguCasesQuery, getLguCasesResponseSchema } from 'shared';
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
