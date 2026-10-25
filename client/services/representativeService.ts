import axios from 'axios';
import {
  getRepresentativeResponseSchema,
  representativeSchema,
  type CreateRepresentativeQuery,
  type UpdateRepresentativeQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';

export async function createRepresentative(payload: CreateRepresentativeQuery) {
  try {
    const res = await API.post('/representatives', payload);

    return representativeSchema.parse(res.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error creating representative:', error);
    throw error;
  }
}

/**
 * Fetches a representative by id.
 */
export async function getRepresentative(representativeid: number) {
  const response = await API.get(`/representatives/${representativeid}`);

  return getRepresentativeResponseSchema.parse(response.data).data;
}

/**
 * Partially updates a representative and returns the updated row.
 */
export async function updateRepresentative(
  representativeid: number,
  payload: UpdateRepresentativeQuery,
) {
  try {
    const response = await API.patch(
      `/representatives/${representativeid}`,
      payload,
    );
    return getRepresentativeResponseSchema.parse(response.data).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error updating representative:', error);
    throw error;
  }
}

export async function deleteRepresentative(reprsentativeid: number) {
  try {
    const response = await API.delete(`/representatives/${reprsentativeid}`);
    return representativeSchema.parse(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error deleting representative:', error);
    throw error;
  }
}
