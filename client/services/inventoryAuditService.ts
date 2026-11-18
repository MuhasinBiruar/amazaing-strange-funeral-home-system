import axios from 'axios';
import {
  getInventoryAuditsResponseSchema,
  inventoryAuditSchema,
  type CreateInventoryAuditQuery,
  type GetInventoryAuditsQuery,
  type UpdateInventoryAuditQuery,
} from 'shared';
import { API } from './api';
import { extractErrorMessage } from './utils/extractErrorMessage';
import { notifyNotificationsChanged } from './notificationService';

export type AuditDelivery = {
  deliveryid: number;
  deliverydate: Date;
  quantityreceived: number;
  totalamountpaid: number;
};

export async function getAuditDeliveries(
  targetType: 'formalin' | 'casket',
  targetId: number,
) {
  const path =
    targetType === 'casket'
      ? `/casketinventory/${targetId}/deliveryhistory`
      : `/deliveries/formalin/history/${targetId}`;
  const result = await API.get(path, { withCredentials: true });
  return result.data.data as AuditDelivery[];
}

export async function getInventoryAudits(
  query: GetInventoryAuditsQuery & { signal?: AbortSignal },
) {
  const { signal, ...params } = query;
  const result = await API.get('/inventoryaudits', {
    params,
    withCredentials: true,
    signal,
  });
  return getInventoryAuditsResponseSchema.parse(result.data);
}

/** Rethrows API errors with the server's message instead of Axios's generic one. */
function withServerMessage(error: unknown): never {
  if (axios.isAxiosError(error) && error.response?.data?.error?.message)
    throw new Error(extractErrorMessage(error.response.data));
  throw error;
}

export async function createInventoryAudit(payload: CreateInventoryAuditQuery) {
  try {
    const result = await API.post('/inventoryaudits', payload, {
      withCredentials: true,
    });
    notifyNotificationsChanged();
    return inventoryAuditSchema.parse(result.data.data);
  } catch (error) {
    withServerMessage(error);
  }
}

export async function updateInventoryAudit(
  auditid: number,
  payload: UpdateInventoryAuditQuery,
) {
  try {
    const result = await API.patch(`/inventoryaudits/${auditid}`, payload, {
      withCredentials: true,
    });
    notifyNotificationsChanged();
    return inventoryAuditSchema.parse(result.data.data);
  } catch (error) {
    withServerMessage(error);
  }
}
