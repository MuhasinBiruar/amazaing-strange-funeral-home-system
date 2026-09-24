import axios from 'axios';
import {
  getStaffDetailResponseSchema,
  getStaffResponseSchema,
  type CreateStaffQuery,
  type GetStaffQuery,
  type GetStaffResponse,
  type StaffDetail,
  type UpdateStaffQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';

export async function getStaffList(
  params: GetStaffQuery & { signal?: AbortSignal },
): Promise<GetStaffResponse> {
  const { signal, ...query } = params;
  const search = new URLSearchParams();
  search.append('page', String(query.page));
  search.append('limit', String(query.limit));
  search.append('sortBy', query.sortBy);
  search.append('sortOrder', query.sortOrder);
  if (query.search) search.append('search', query.search);
  if (query.isActive !== undefined)
    search.append('isActive', String(query.isActive));

  const res = await API.get(`/staff?${search}`, { signal });
  return getStaffResponseSchema.parse(res.data);
}

export async function getStaffDetail(id: string): Promise<StaffDetail> {
  const res = await API.get(`/staff/${id}`);
  return getStaffDetailResponseSchema.parse(res.data).data;
}

export const createStaff = async (staffData: CreateStaffQuery) => {
  try {
    const res = await API.post('/staff', staffData);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error creating staff:', error);
    throw error;
  }
};

export const updateStaff = async (id: string, staffData: UpdateStaffQuery) => {
  try {
    const res = await API.patch(`/staff/${id}`, staffData);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message)
      throw new Error(extractErrorMessage(error.response.data));

    console.error('Error updating staff:', error);
    throw error;
  }
};
