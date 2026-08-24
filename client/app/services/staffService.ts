import type { AppErrorResponse, StaffSchemaType } from 'shared';
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

export function extractErrorMessage(data: AppErrorResponse): string {
  const details = data.error.details;

  // Format array of field-specific errors if available
  if (Array.isArray(details) && details.length > 0) {
    const grouped = Map.groupBy(details, (item) => item.field);

    return Array.from(grouped, ([field, items]) => {
      return `${field}: ${items.map((i) => i.message).join(', ')}`;
    }).join('; ');
  }

  return data.error.message;
}

export const createStaff = async (staffData: StaffSchemaType) => {
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
