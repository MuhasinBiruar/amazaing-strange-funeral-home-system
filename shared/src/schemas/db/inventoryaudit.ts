import { z } from 'zod';
import { paginationQuerySchema, paginationResponseSchema } from '@/utils/pagination-schema';

export const createInventoryAuditQuerySchema = z
  .object({
    auditdate: z.coerce.date(),
    hasdiscrepancy: z.boolean(),
    formalinid: z.int32().nullable(),
    casketid: z.int32().nullable(),
  })
  .refine((value) => (value.formalinid !== null) !== (value.casketid !== null), {
    message: 'Select either formalin or a casket.',
  });

export type CreateInventoryAuditQuery = z.infer<
  typeof createInventoryAuditQuerySchema
>;

export const updateInventoryAuditQuerySchema = z.object({
  auditdate: z.coerce.date().optional(),
  hasdiscrepancy: z.boolean().optional(),
  currentstock: z.number().nonnegative().optional(),
  deliveryid: z.int32().optional(),
  correctedquantityreceived: z.number().positive().optional(),
  correctedtotalamountpaid: z.number().nonnegative().optional(),
});

export type UpdateInventoryAuditQuery = z.infer<
  typeof updateInventoryAuditQuerySchema
>;

export const inventoryAuditSchema = z.object({
  auditid: z.int32(),
  auditdate: z.coerce.date(),
  hasdiscrepancy: z.boolean(),
  formalinid: z.int32().nullable(),
  casketid: z.int32().nullable(),
  targetname: z.string(),
  currentstock: z.number().nullable(),
});

export type InventoryAudit = z.infer<typeof inventoryAuditSchema>;

export const getInventoryAuditsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  targetType: z.enum(['formalin', 'casket']).default('formalin'),
  sortBy: z.enum(['auditdate', 'targetname', 'currentstock', 'hasdiscrepancy']).default('auditdate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetInventoryAuditsQuery = z.infer<
  typeof getInventoryAuditsQuerySchema
>;

export const getInventoryAuditsResponseSchema = paginationResponseSchema.extend({
  data: z.array(inventoryAuditSchema),
});
