import type { StaffSchemaType } from 'shared';
import { API } from './api';
import axios from 'axios';

export const getStaff = async (username: string) => {
  try {
    const res = await API.get(`/staff/${username}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

export const createStaff = async (staffData: StaffSchemaType) => {
  try {
    const res = await API.post('/staff', staffData);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      // Rethrow with the real message
      throw new Error(error.response.data.error.message);
    }
    console.error('Error creating staff:', error);
    throw error;
  }
};
