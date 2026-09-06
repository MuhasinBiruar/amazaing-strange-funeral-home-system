import { API } from './api';

export async function getDeceasedRecord(id: number) {
  try {
    const response = await API.get(`/deceasedrecords/${id}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching deceased record:', error);
    throw error;
  }
}
