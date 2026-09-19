import { API } from './api';
import type { CreateTransactionInput } from 'shared';

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

export async function createCaseTransaction(
  caseId: number,
  payload: CreateTransactionInput,
) {
  const res = await API.post<{ data: any }>(
    `/financial/direct/${caseId}/transactions`,
    payload,
  );
  return res.data;
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

export interface CaseTransaction {
  transactionid: number;
  amount: string;
  paymentcategory: string;
  transactionstatus: string;
  paymentdatetime: string;
}

export async function getCaseTransactions(
  caseid: number,
  signal?: AbortSignal,
): Promise<{ data: CaseTransaction[] }> {
  const result = await API.get(`/financial/direct/${caseid}/transactions`, {
    withCredentials: true,
    signal,
  });
  return result.data;
}

export interface CreateLguCaseInput {
  caseid: number;
  reimbursementstatus: string;
  reimbursementamount: number;
}

export async function createLguCase(data: CreateLguCaseInput) {
  const result = await API.post('/financial/lgucases', data, {
    withCredentials: true,
  });
  return result.data;
}

export interface CreateLifeplanInput {
  caseid: number;
  plannumber: string;
  planholdername: string;
  minimumthreshold: number;
  totalamount: number;
  companyid: number;
}

export async function createLifeplan(data: CreateLifeplanInput) {
  const result = await API.post('/financial/lifeplans', data, {
    withCredentials: true,
  });
  return result.data;
}

export interface LifeplanCompany {
  companyid: number;
  companyname: string;
  contactinfo: string | null;
}

export async function getLifeplanCompanies({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: PaginatedParams): Promise<PaginatedResult<LifeplanCompany>> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/financial/lifeplans/companies?${params}`, {
    withCredentials: true,
    signal,
  });
  return result.data;
}

export interface CreateLifeplanCompanyInput {
  companyname: string;
  contactinfo?: string | null;
}

export async function createLifeplanCompany(data: CreateLifeplanCompanyInput) {
  const result = await API.post('/financial/lifeplans/companies', data, {
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