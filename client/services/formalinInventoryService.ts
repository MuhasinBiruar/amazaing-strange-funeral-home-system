import {
  formalinDeliveryHistoryResponseSchema,
  formalinInventoryMutationResponseSchema,
  formalinInventoryResponseSchema,
  formalinUsageResponseSchema,
  getFormalinUsageResponseSchema,
  type CreateFormalinUsage,
  type FormalinInventoryMutation,
} from 'shared';
import { API } from './api';

export async function getFormalinInventory(signal?: AbortSignal) {
  const result = await API.get('/formalininventory', {
    withCredentials: true,
    signal,
  });
  return formalinInventoryResponseSchema.parse(result.data).data;
}

export async function addFormalinStock(payload: FormalinInventoryMutation) {
  const result = await API.post('/formalininventory', payload, {
    withCredentials: true,
  });
  return formalinInventoryMutationResponseSchema.parse(result.data);
}

export async function recordFormalinUsage(payload: CreateFormalinUsage) {
  const result = await API.post('/formalininventory/usage', payload, {
    withCredentials: true,
  });
  return formalinUsageResponseSchema.parse(result.data);
}

export async function getFormalinDeliveries(signal?: AbortSignal) {
  const result = await API.get('/formalininventory/deliveries', {
    withCredentials: true,
    signal,
  });
  return formalinDeliveryHistoryResponseSchema.parse(result.data).data;
}

export async function getFormalinUsageHistory({
  page,
  limit,
  signal,
}: {
  page: number;
  limit: number;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const result = await API.get(`/formalininventory/usage?${params}`, {
    withCredentials: true,
    signal,
  });
  return getFormalinUsageResponseSchema.parse(result.data);
}
