import { getAuditLogsResponseSchema } from 'shared';
import { API } from './api';

/** Fetches the administrator-only audit history. */
export async function getAuditLogs(signal?: AbortSignal) {
  const result = await API.get('/auditlogs', {
    withCredentials: true,
    signal,
  });
  return getAuditLogsResponseSchema.parse(result.data).data;
}
