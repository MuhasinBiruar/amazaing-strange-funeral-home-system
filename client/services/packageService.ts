import { getPackagesResponseSchema } from 'shared';
import { API } from './api';

/**
 * Fetches every service package. Used to populate the package dropdown in the
 * new-contract panel, which prefills the contract amount, embalming period and
 * inclusions from the chosen package.
 */
export async function getPackages(signal?: AbortSignal) {
  const result = await API.get('/packages', {
    withCredentials: true,
    signal,
  });

  return getPackagesResponseSchema.parse(result.data).data;
}
