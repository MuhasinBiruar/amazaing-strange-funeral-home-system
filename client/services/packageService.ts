import axios from 'axios';
import { getPackagesResponseSchema, type CreatePackageQuery } from 'shared';
import { API } from './api';
import { extractErrorMessage } from './staffService';

/**
 * Fetches every service package.
 *
 * @remarks
 * Used by the new-contract panel's guided package picker, which narrows this
 * list down to a chosen package type before showing it.
 */
export async function getPackages(signal?: AbortSignal) {
  const result = await API.get('/packages', {
    withCredentials: true,
    signal,
  });

  return getPackagesResponseSchema.parse(result.data).data;
}

/**
 * Creates a new service package.
 *
 * @remarks
 * Used by the new-contract panel's "Create package" mode — the package is
 * created only once the contract itself is submitted.
 */
export async function createPackage(
  payload: CreatePackageQuery,
): Promise<{ packageid: number }> {
  try {
    const res = await API.post('/packages', payload);
    return res.data.data as { packageid: number };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error creating package:', error);
    throw error;
  }
}
