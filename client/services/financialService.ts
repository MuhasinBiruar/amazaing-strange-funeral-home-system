import {
  getDirectPlansResponseSchema,
  getDirectTransactionsResponseSchema,
  getFinancialSummaryResponseSchema,
  getLguCasesResponseSchema,
  type CreateLguCaseQuery,
  type GetDirectPlansQuery,
  type GetFinancialSummaryQuery,
  type GetLguCasesQuery,
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

  const result = await API.get(`/financial/lgucases?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLguCasesResponseSchema.parse(result.data);
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

export async function createLguCase(data: CreateLguCaseQuery) {
  const result = await API.post('/financial/lgucases', data, {
    withCredentials: true,
  });
  return result.data;
}

export interface DayTransaction {
  id: string;
  source: 'transaction' | 'casket' | 'formalin';
  amount: string;
  direction: 'in' | 'out';
  caseid: number | null;
  deceased_name: string | null;
  category: string;
  datetime: string;
}

export async function getDayTransactions(
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<{ data: DayTransaction[] }> {
  const params = new URLSearchParams({ startDate, endDate });
  const result = await API.get(`/financial/transactions?${params}`, {
    withCredentials: true,
    signal,
  });
  return result.data;
}
