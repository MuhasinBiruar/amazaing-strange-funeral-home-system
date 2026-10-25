import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { lguCaseSchema } from '../db/lgucase';
import { deceasedRecordSchema } from '../db/deceasedrecord';

/**
 * Combination of the following tables:
 * `lgucase` + `deceasedrecord`
 */
export const getLguCasesRowSchema = lguCaseSchema.extend({
  lguid: z.int32().nullable(),
  deceased_name: z.string(),
  servicestatus: deceasedRecordSchema.shape.servicestatus,
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
