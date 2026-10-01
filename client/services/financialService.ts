import {
  getDirectPlansResponseSchema,
  getDirectTransactionsResponseSchema,
  getFinancialDetailsResponseSchema,
  getFinancialSummaryResponseSchema,
  type GetDirectPlansQuery,
  type GetFinancialSummaryQuery,
} from 'shared';
import { API } from './api';

export async function getDirectPlans({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: GetDirectPlansQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/financial/direct?${params}`, {
    withCredentials: true,
    signal,
  });
  return getDirectPlansResponseSchema.parse(result.data);
}

export async function getFinancialSummary({
  unit = 'month',
  interval,
  startDate,
  endDate,
  caseid,
  signal,
}: Omit<GetFinancialSummaryQuery, 'interval' | 'startDate'> & {
  interval?: number;
  startDate?: string;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('unit', unit);
  if (interval) params.append('interval', String(interval));
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (caseid !== undefined) params.append('caseid', String(caseid));

  const result = await API.get(`/financial/summary?${params}`, {
    withCredentials: true,
    signal,
  });
  return getFinancialSummaryResponseSchema.parse(result.data);
}

export async function getDirectTransactions(
  caseid: number,
  signal?: AbortSignal,
) {
  const result = await API.get(`/financial/direct/${caseid}/transactions`, {
    withCredentials: true,
    signal,
  });
  return getDirectTransactionsResponseSchema.parse(result.data);
}

export async function getFinancialDetails(
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ startDate, endDate });
  const result = await API.get(`/financial/details?${params}`, {
    withCredentials: true,
    signal,
  });
  return getFinancialDetailsResponseSchema.parse(result.data);
}
