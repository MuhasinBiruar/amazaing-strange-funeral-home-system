import { getCasesResponseSchema, type GetCasesQuery } from 'shared';
import { API } from './api';

export async function getCases({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  status,
  startDate,
  endDate,
  signal,
}: Omit<GetCasesQuery, 'startDate'> & {
  startDate?: string | undefined;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/cases?${params}`, {
    withCredentials: true,
    signal,
  });
  return getCasesResponseSchema.parse(result.data);
}
