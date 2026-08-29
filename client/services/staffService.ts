import type { AppErrorResponse, CreateStaffQuery } from 'shared';
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

export function extractErrorMessage(data: AppErrorResponse): string {
  const details = data.error.details;

  // Format array of field-specific errors if available
  if (Array.isArray(details) && details.length > 0) {
    const map = new Map<string, string[]>();

    for (const { field = '', message } of details) {
      const existing = map.get(field);
      if (existing) {
        existing.push(message);
      } else {
        map.set(field, [message]);
      }
    }

    return Array.from(map.entries())
      .map(([field, messages]) =>
        field ? `${field}: ${messages.join(', ')}` : messages.join(', '),
      )
      .join('; ');
  }

  return data.error.message;
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
