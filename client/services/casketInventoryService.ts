import {
  casketInventoryResponseSchema,
  getCasketInventoryResponseSchema,
  getPaginatedCasketInventoryResponseSchema,
  type CreateCasketInventoryQuery,
  type GetPaginatedCasketInventoryQuery,
  type UpdateCasketInventoryQuery,
} from 'shared';
import { API } from './api';
import { toReadableError } from './utils/toReadableError';

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

export async function getCasketInventoryById(
  casketid: number,
  signal?: AbortSignal,
) {
  const result = await API.get(
    `/casketinventory/casket/${casketid}/deliveryhistory`,
    {
      withCredentials: true,
      signal,
    },
  );
  return result.data.data;
}

export async function getCasketPackages(
  casketid: number,
  signal?: AbortSignal,
) {
  const result = await API.get(`/casketinventory/casket/${casketid}/packages`, {
    withCredentials: true,
    signal,
  });
  return result.data.data;
}

export async function createCasket(payload: CreateCasketInventoryQuery) {
  try {
    const result = await API.post('/casketinventory', payload, {
      withCredentials: true,
    });
    return casketInventoryResponseSchema.parse(result.data).data;
  } catch (error) {
    throw toReadableError(error, 'Failed to add casket.');
  }
}

export async function updateCasket(
  casketid: number,
  payload: UpdateCasketInventoryQuery,
) {
  try {
    const result = await API.patch(`/casketinventory/${casketid}`, payload, {
      withCredentials: true,
    });
    return casketInventoryResponseSchema.parse(result.data).data;
  } catch (error) {
    throw toReadableError(error, 'Failed to save casket.');
  }
}

export async function deleteCasket(casketid: number) {
  try {
    await API.delete(`/casketinventory/${casketid}`, {
      withCredentials: true,
    });
  } catch (error) {
    throw toReadableError(error, 'Failed to delete casket.');
  }
}
