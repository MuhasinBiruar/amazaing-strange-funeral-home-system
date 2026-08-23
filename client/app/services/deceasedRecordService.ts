import { API } from './api';

export const getDeceasedRecord = async (id: number) => {
    try {
        const response = await API.get(`/deceasedrecords/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching deceased record:', error);
        throw error;
    }
};