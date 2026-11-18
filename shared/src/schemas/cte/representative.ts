import z from 'zod';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { representativeSchema } from '../db/representative';

/**
 * A `representative` row plus how many deceased records it represents.
 */
export const getRepresentativesRowSchema = representativeSchema.extend({
  case_count: z.coerce.number().int().nonnegative(),
});

export type GetRepresentativesRow = z.infer<typeof getRepresentativesRowSchema>;

/**
 * @remarks
 * `search` matches the full name or contact number; `startDate`/`endDate`
 * filter on `representative.datecreated`.
 */
export const getRepresentativesQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    sortBy: z
      .enum([
        'lastname',
        'firstname',
        'middlename',
        'datecreated',
        'case_count',
      ])
      .default('lastname'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
);

export type GetRepresentativesQuery = z.infer<
  typeof getRepresentativesQuerySchema
>;

export const getRepresentativesResponseSchema = paginationResponseSchema.extend(
  { data: z.array(getRepresentativesRowSchema) },
);

export type GetRepresentativesResponse = z.infer<
  typeof getRepresentativesResponseSchema
>;
