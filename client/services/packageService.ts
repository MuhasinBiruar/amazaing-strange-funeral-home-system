import axios from 'axios';
import type { CreatePackageQuery } from 'shared';
import { API } from './api';
import { extractErrorMessage } from './staffService';

/**
 * Creates a new service package.
 *
 * @remarks
 * Used by the new-contract panel's package builder — every contract gets a
 * package created for it there (quick form or guided wizard), rather than
 * picking one from a shared catalog.
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
