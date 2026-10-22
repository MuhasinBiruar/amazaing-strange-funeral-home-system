import {
  getFormalinInventoryResponseSchema,
  createFormalinUsageResponseSchema,
  getFormalinUsageSummaryResponseSchema,
  getFormalinUsageResponseSchema,
  type CreateFormalinUsage,
  type GetFormalinUsageBreakdownQuery,
  type GetFormalinUsageSummaryQuery,
} from 'shared';
import { API } from './api';

export async function getFormalinInventory(signal?: AbortSignal) {
  const result = await API.get('/formalininventory', {
    withCredentials: true,
    signal,
  });
  return getFormalinInventoryResponseSchema.parse(result.data).data;
}

export async function getFormalinUsageHistory({
  page,
  limit,
  signal,
}: {
  page: number;
  limit: number;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const result = await API.get(`/formalininventory/usage?${params}`, {
    withCredentials: true,
    signal,
  });
  return getFormalinUsageResponseSchema.parse(result.data);
}

export async function recordFormalinUsage(payload: CreateFormalinUsage) {
  const result = await API.post('/formalininventory/usage', payload, {
    withCredentials: true,
  });
  return createFormalinUsageResponseSchema.parse(result.data);
}

export async function getFormalinUsageSummary({
  page,
  limit,
  sortBy,
  sortOrder,
  startDate,
  endDate,
  signal,
}: Omit<GetFormalinUsageSummaryQuery, 'startDate' | 'endDate'> & {
  startDate?: string;
  endDate?: string;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const result = await API.get(`/formalininventory/usage/summary?${params}`, {
    withCredentials: true,
    signal,
  });
  return getFormalinUsageSummaryResponseSchema.parse(result.data);
}

export async function getFormalinUsageBreakdown({
  page,
  limit,
  sortBy,
  sortOrder,
  startDate,
  endDate,
  signal,
}: Omit<GetFormalinUsageBreakdownQuery, 'startDate' | 'endDate'> & {
  startDate?: string;
  endDate?: string;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const result = await API.get(`/formalininventory/usage/breakdown?${params}`, {
    withCredentials: true,
    signal,
  });
  return getFormalinUsageResponseSchema.parse(result.data);
}
