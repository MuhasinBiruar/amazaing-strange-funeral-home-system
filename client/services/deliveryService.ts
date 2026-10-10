import {
  getCasketDeliveriesResponseSchema,
  getFormalinDeliveriesResponseSchema,
  type GetCasketDeliveriesQuery,
  type GetFormalinDeliveriesQuery,
} from 'shared';
import { API } from './api';

export async function getCasketDeliveries({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  tier,
  startDate,
  endDate,
  signal,
}: Omit<GetCasketDeliveriesQuery, 'startDate'> & {
  startDate?: string | undefined;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (tier) params.append('tier', tier);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/deliveries/casket?${params}`, {
    withCredentials: true,
    signal,
  });

  return getCasketDeliveriesResponseSchema.parse(result.data);
}

export async function getFormalinDeliveries({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  startDate,
  endDate,
  signal,
}: Omit<GetFormalinDeliveriesQuery, 'startDate'> & {
  startDate?: string | undefined;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/deliveries/formalin?${params}`, {
    withCredentials: true,
    signal,
  });

  return getFormalinDeliveriesResponseSchema.parse(result.data);
}
