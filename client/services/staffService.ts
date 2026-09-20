import type { CreateStaffQuery } from 'shared';
import { API } from './api';
import axios from 'axios';
import { extractErrorMessage } from './utils/extractErrorMessage';

export const getStaff = async (username: string) => {
  try {
    const res = await API.get(`/staff/${username}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

interface StaffListResponse {
  data: CreateStaffQuery[];
}

export const getAllStaff = async (): Promise<CreateStaffQuery[]> => {
  try {
    const res = await API.get<StaffListResponse>('/staff');
    return res.data.data ?? [];
  } catch (error) {
    console.error('Error fetching all staff:', error);
    throw error;
  }
};

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
