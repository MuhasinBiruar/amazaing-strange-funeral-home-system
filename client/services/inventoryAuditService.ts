import {
  getInventoryAuditsResponseSchema,
  inventoryAuditSchema,
  type CreateInventoryAuditQuery,
  type GetInventoryAuditsQuery,
  type UpdateInventoryAuditQuery,
} from 'shared';
import { API } from './api';
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

export async function createInventoryAudit(payload: CreateInventoryAuditQuery) {
  const result = await API.post('/inventoryaudits', payload, {
    withCredentials: true,
  });
  notifyNotificationsChanged();
  return inventoryAuditSchema.parse(result.data.data);
}

export async function updateInventoryAudit(
  auditid: number,
  payload: UpdateInventoryAuditQuery,
) {
  const result = await API.patch(`/inventoryaudits/${auditid}`, payload, {
    withCredentials: true,
  });
  notifyNotificationsChanged();
  return inventoryAuditSchema.parse(result.data.data);
}
