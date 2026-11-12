import axios from 'axios';
import {
  getContractResponseSchema,
  type CreateContractQuery,
  type UpdateContractQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';

/**
 * Creates a contract for a case.
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

export async function getContract(contractid: number, signal?: AbortSignal) {
  const res = await API.get(`/contracts/${contractid}`, { signal });
  return getContractResponseSchema.parse(res.data).data;
}

/**
 * Changes what can be changed on a contract after it's made (its burial
 * deadline); the case's service status is recalculated.
 */
export async function updateContract(
  contractid: number,
  payload: UpdateContractQuery,
) {
  try {
    const res = await API.patch(`/contracts/${contractid}`, payload);
    return getContractResponseSchema.parse(res.data).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    throw error;
  }
}
