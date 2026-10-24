import axios from 'axios';
import type { CreateContractQuery } from 'shared';
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
