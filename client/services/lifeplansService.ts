import axios from 'axios';
import {
  type CreateLifeplanQuery,
  type GetLifeplansQuery,
  getLifeplansResponseSchema,
  type GetLifeplanCompaniesQuery,
  getLifeplanCompaniesResponseSchema,
  type CreateLifeplanCompanyQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';

export async function getLifeplans({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  companyid,
  startDate,
  endDate,
  signal,
}: Omit<GetLifeplansQuery, 'startDate'> & {
  startDate?: string | undefined;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (companyid !== undefined) params.append('companyid', String(companyid));
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/lifeplans?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLifeplansResponseSchema.parse(result.data);
}

export async function getMyLifeplans({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  startDate,
  endDate,
  signal,
}: Omit<GetLifeplansQuery, 'startDate'> & {
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

  const result = await API.get(`/lifeplans/mine?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLifeplansResponseSchema.parse(result.data);
}

export async function createLifeplan(payload: CreateLifeplanQuery) {
  const result = await API.post('/lifeplans', payload, {
    withCredentials: true,
  });
  return result.data;
}

export async function getLifeplanCompanies({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  startDate,
  endDate,
  signal,
}: GetLifeplanCompaniesQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/lifeplans/companies?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLifeplanCompaniesResponseSchema.parse(result.data);
}

export async function createLifeplanCompany(data: CreateLifeplanCompanyQuery) {
  try {
    const result = await API.post('/lifeplans/companies', data, {
      withCredentials: true,
    });
    return result.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));
    throw error;
  }
}
