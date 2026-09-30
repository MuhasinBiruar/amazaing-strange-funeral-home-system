import z from 'zod';
import { paginationResponseSchema } from '@/utils/pagination-schema';

export const formalinInventorySchema = z.object({
  formalinid: z.int32(),
  currentstock: z.float64().nonnegative(),
  minimumthreshold: z.float64().nonnegative(),
  date: z.coerce.date(),
});

export type FormalinInventory = z.infer<typeof formalinInventorySchema>;

export const formalinInventoryMutationSchema = z.object({
  currentstock: z.float64().positive(),
  minimumthreshold: z.float64().nonnegative(),
});

export type FormalinInventoryMutation = z.infer<
  typeof formalinInventoryMutationSchema
>;

export const formalinInventoryResponseSchema = z.object({
  data: formalinInventorySchema,
});

export type FormalinInventoryResponse = z.infer<
  typeof formalinInventoryResponseSchema
>;

export const formalinInventoryMutationResponseSchema = z.object({
  data: formalinInventorySchema,
  warning: z.string().nullable(),
});

export type FormalinInventoryMutationResponse = z.infer<
  typeof formalinInventoryMutationResponseSchema
>;

export const formalinDeliveryHistorySchema = z.object({
  deliveryid: z.int32(),
  quantityreceived: z.float64().nonnegative(),
  deliverydate: z.coerce.date(),
  formalinid: z.int32().nullable(),
  totalamountpaid: z.float64().nonnegative(),
});

export type FormalinDeliveryHistory = z.infer<
  typeof formalinDeliveryHistorySchema
>;

export const formalinDeliveryHistoryResponseSchema = z.object({
  data: z.array(formalinDeliveryHistorySchema),
});

export type FormalinDeliveryHistoryResponse = z.infer<
  typeof formalinDeliveryHistoryResponseSchema
>;

export const formalinInventoryHistoryResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(formalinInventorySchema),
  });

export type FormalinInventoryHistoryResponse = z.infer<
  typeof formalinInventoryHistoryResponseSchema
>;
