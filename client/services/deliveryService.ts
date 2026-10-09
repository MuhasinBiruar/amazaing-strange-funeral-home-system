import { getDeliveriesResponseSchema, type GetDeliveriesQuery } from 'shared';
import { API } from './api';

export async function getDeliveries({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  source,
  startDate,
  endDate,
  signal,
}: Omit<GetDeliveriesQuery, 'startDate'> & {
  startDate?: string | undefined;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (source) params.append('source', source);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/deliveries?${params}`, {
    withCredentials: true,
    signal,
  });

  return getDeliveriesResponseSchema.parse(result.data);
}
