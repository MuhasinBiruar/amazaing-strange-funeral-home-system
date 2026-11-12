import z from 'zod';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { deletionEntityTypeEnum, deletionSchema } from '../db/deletion';

/**
 * Combination of the following tables:
 * `deletion` + `staff` (who deleted it)
 */
export const deletionLogSchema = deletionSchema.extend({
  deletedby_name: z.string(),
});

export type DeletionLog = z.infer<typeof deletionLogSchema>;

/**
 * @remarks
 * `startDate`/`endDate` filter on `deletedat`.
 */
export const getDeletionsQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    entitytype: deletionEntityTypeEnum.optional(),
    sortBy: z.keyof(deletionLogSchema).default('deletedat'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export type GetDeletionsQuery = z.infer<typeof getDeletionsQuerySchema>;

export const getDeletionsResponseSchema = paginationResponseSchema.extend({
  data: z.array(deletionLogSchema),
});

export type GetDeletionsResponse = z.infer<typeof getDeletionsResponseSchema>;
