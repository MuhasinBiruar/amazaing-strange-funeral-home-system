import {
  burialRecordSchema,
  getBurialRecordsResponseSchema,
  type CreateBurialRecordQuery,
  type GetBurialRecordsQuery,
  type UpdateBurialRecordQuery,
} from 'shared';
import { API } from './api';

export async function getBurialRecords(
  query: Omit<GetBurialRecordsQuery, 'startDate' | 'endDate'> & {
    startDate?: string;
    endDate?: string;
    signal?: AbortSignal;
  },
) {
  const { signal, ...params } = query;
  const result = await API.get('/burialrecords', {
    params,
    withCredentials: true,
    signal,
  });
  return getBurialRecordsResponseSchema.parse(result.data);
}

export async function createBurialRecord(payload: CreateBurialRecordQuery) {
  const result = await API.post('/burialrecords', payload, {
    withCredentials: true,
  });
  return result.data;
}

export async function updateBurialRecord(
  burialid: number,
  payload: UpdateBurialRecordQuery,
) {
  const result = await API.patch(`/burialrecords/${burialid}`, payload, {
    withCredentials: true,
  });
  return burialRecordSchema.parse(result.data.data);
}
