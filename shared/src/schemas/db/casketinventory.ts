import { z } from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

export const casketInventorySchema = z.object({
  casketid: z.int32(),
  caskettype: z.string(),
  caskettier: z.string().nullable(),
  currentstock: z.int32(),
  minimumthreshold: z.int32(),
});

export type CasketInventory = z.infer<typeof casketInventorySchema>;

export const getCasketInventoryResponseSchema = z.object({
  data: z.array(casketInventorySchema),
});

export type GetCasketInventoryResponse = z.infer<
  typeof getCasketInventoryResponseSchema
>;

export const casketInventoryTableSchema = casketInventorySchema.pick({
  casketid: true,
  caskettype: true,
  currentstock: true,
});

export type CasketInventoryTable = z.infer<typeof casketInventoryTableSchema>;

export const getPaginatedCasketInventoryQuerySchema =
  paginationQuerySchema.extend({
    search: z.string().optional(),
    sortBy: z
      .enum(['casketid', 'caskettype', 'currentstock'])
      .default('caskettype'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  });

export type GetPaginatedCasketInventoryQuery = z.infer<
  typeof getPaginatedCasketInventoryQuerySchema
>;

export const getPaginatedCasketInventoryResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(casketInventoryTableSchema),
  });

export type GetPaginatedCasketInventoryResponse = z.infer<
  typeof getPaginatedCasketInventoryResponseSchema
>;
