import { getCasketInventoryResponseSchema } from 'shared';
import { API } from './api';

/** Fetches every casket in inventory, for the package builder's casket picker. */
export async function getCasketInventory(signal?: AbortSignal) {
  const result = await API.get('/casketinventory', {
    withCredentials: true,
    signal,
  });

  return getCasketInventoryResponseSchema.parse(result.data).data;
}
