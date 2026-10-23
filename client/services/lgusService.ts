import axios from 'axios';
import {
  getLgusResponseSchema,
  lguSchema,
  type CreateLguQuery,
  type GetLgusQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';

export async function getLgus({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  startDate,
  endDate,
  signal,
}: GetLgusQuery & { signal?: AbortSignal }) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const result = await API.get(`/lgus?${params}`, {
    withCredentials: true,
    signal,
  });
  return getLgusResponseSchema.parse(result.data);
}

export async function createLgu(data: CreateLguQuery) {
  try {
    const result = await API.post('/lgus', data, {
      withCredentials: true,
    });
    return lguSchema.parse(result.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));
    throw error;
  }
}
