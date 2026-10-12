import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { lguCaseSchema } from '../db/lgucase';

/**
 * Combination of the following tables:
 * `lgucase` + `deceasedrecord`
 */
export const getLguCasesRowSchema = lguCaseSchema.extend({
  deceased_name: z.string(),
});

export type GetLguCasesRow = z.infer<typeof getLguCasesRowSchema>;

export const getLguCasesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(getLguCasesRowSchema).default('lgucaseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLguCasesQuery = z.infer<typeof getLguCasesQuerySchema>;

export const getLguCasesResponseSchema = paginationResponseSchema.extend({
  data: z.array(getLguCasesRowSchema),
});

export type GetLguCasesResponse = z.infer<typeof getLguCasesResponseSchema>;
