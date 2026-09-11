import axios from 'axios';
import type { CreateContractQuery } from 'shared';
import { API } from './api';
import { extractErrorMessage } from './staffService';

/**
 * Creates a contract for a case.
 *
 * @remarks
 * Rethrows server-side validation failures as a plain `Error` carrying the
 * formatted message, so callers can render it directly. This is what surfaces
 * "A contract for this case already exists." when the `contract_caseid_key`
 * unique constraint rejects a duplicate — the last line of defence if someone
 * else contracts the same record between page load and submit.
 */
export async function createContract(payload: CreateContractQuery) {
  try {
    const res = await API.post('/contracts', payload);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error creating contract:', error);
    throw error;
  }
}
