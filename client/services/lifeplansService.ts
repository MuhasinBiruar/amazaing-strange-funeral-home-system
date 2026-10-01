import {
  type GetLifeplansQuery,
  getLifeplansResponseSchema,
  type CreateLifeplanQuery,
  type GetLifeplanCompaniesQuery,
  getLifeplanCompaniesResponseSchema,
  type CreateLifeplanCompanyQuery,
} from 'shared';
import { API } from './api';

export async function getLifeplans({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: GetLifeplansQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/lifeplans?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLifeplansResponseSchema.parse(result.data);
}

export async function createLifeplan(data: CreateLifeplanQuery) {
  const result = await API.post('/lifeplans', data, {
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
  signal,
}: GetLifeplanCompaniesQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);

  const result = await API.get(`/lifeplans/companies?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLifeplanCompaniesResponseSchema.parse(result.data);
}

export async function createLifeplanCompany(data: CreateLifeplanCompanyQuery) {
  const result = await API.post('/lifeplans/companies', data, {
    withCredentials: true,
  });
  return result.data;
}
