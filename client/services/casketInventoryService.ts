import {
  getCasketInventoryResponseSchema,
  getPaginatedCasketInventoryResponseSchema,
  type GetPaginatedCasketInventoryQuery,
} from 'shared';
import { API } from './api';

/** Fetches every casket in inventory, for the package builder's casket picker. */
export async function getCasketInventory(signal?: AbortSignal) {
  const result = await API.get('/casketinventory', {
    withCredentials: true,
    signal,
  });

  return getCasketInventoryResponseSchema.parse(result.data).data;
}

export async function getPaginatedCasketInventory({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  signal,
}: GetPaginatedCasketInventoryQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  if (search) params.set('search', search);

  const result = await API.get(`/casketinventory/paginated?${params}`, {
    withCredentials: true,
    signal,
  });

  return getPaginatedCasketInventoryResponseSchema.parse(result.data);
}

export async function getCasketPackages(
  casketid: number,
  signal?: AbortSignal,
) {
  const result = await API.get(`/casketinventory/casket/${casketid}/packages`, {
    withCredentials: true,
    signal,
  });
  return result.data; //review if it makes sense
}
