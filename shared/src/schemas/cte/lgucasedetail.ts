import z from 'zod';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { lguCaseSchema } from '../db/lgucase';
import { deceasedRecordSchema } from '../db/deceasedrecord';

/**
 * Combination of the following tables:
 * `lgucase` + `deceasedrecord`
 */
export const getLguCasesRowSchema = lguCaseSchema.extend({
  deceased_name: z.string(),
  servicestatus: deceasedRecordSchema.shape.servicestatus,
});

export type GetLguCasesRow = z.infer<typeof getLguCasesRowSchema>;

/**
 * @remarks
 * `startDate`/`endDate` filter on `deceasedrecord.datecreated`, the same date
 * the LGU summary's `totalrecords` is counted by, so a summary row's count
 * and its record list agree.
 */
export const getLguCasesQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    lguid: z.coerce.number().int().positive().optional(),
    sortBy: z.keyof(getLguCasesRowSchema).default('lgucaseid'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
);

export type GetLguCasesQuery = z.infer<typeof getLguCasesQuerySchema>;

export const getLguCasesResponseSchema = paginationResponseSchema.extend({
  data: z.array(getLguCasesRowSchema),
});

export type GetLguCasesResponse = z.infer<typeof getLguCasesResponseSchema>;
