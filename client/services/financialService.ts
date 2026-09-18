import { API } from './api';

export interface DirectPlan {
  caseid: number;
  deceased_name: string;
  representativeid: number | null;
  representative_name: string | null;
  contractid: number | null;
  totalamount: number | null;
  totalamountpaid: number;
}

export interface LguCase {
  lgucaseid: number;
  reimbursementstatus: string;
  reimbursementamount: number;
  caseid: number;
  deceased_name: string;
}

export interface Lifeplan {
  planid: number;
  plannumber: string;
  planholdername: string;
  minimumthreshold: number;
  totalamount: number;
  caseid: number;
  deceased_name: string;
  companyid: number;
  companyname: string;
}

export interface FinancialSummaryBucket {
  startDate: string;
  endDate: string;
  totalIn: string;
  totalOut: string;
  transactionCount: number;
}

export interface FinancialSummaryMeta {
  unit: 'day' | 'week' | 'month' | 'year';
  interval: number;
  startDate: string | null;
  endDate: string | null;
  totalIn: number;
  totalOut: number;
}

interface PaginatedParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  signal?: AbortSignal;
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getDirectPlans({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: PaginatedParams): Promise<PaginatedResult<DirectPlan>> {
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
  return result.data;
}

export async function getLguCases({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: PaginatedParams): Promise<PaginatedResult<LguCase>> {
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
  return result.data;
}

export async function getLifeplans({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: PaginatedParams): Promise<PaginatedResult<Lifeplan>> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/financial/lifeplans?${params}`, {
    withCredentials: true,
    signal,
  });
  return result.data;
}

export async function getFinancialSummary({
  unit = 'month',
  interval,
  startDate,
  endDate,
  caseid,
  signal,
}: {
  unit?: 'day' | 'week' | 'month' | 'year';
  interval?: number;
  startDate?: string;
  endDate?: string;
  caseid?: number;
  signal?: AbortSignal;
}): Promise<{ data: FinancialSummaryBucket[]; meta: FinancialSummaryMeta }> {
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
  return result.data;
}