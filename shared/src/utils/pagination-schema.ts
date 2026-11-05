import z from 'zod';
import { dateFilteredQuerySchema } from './date-filtered-query-schema';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
}); 

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationResponseSchema = z.object({
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type PaginationResponse = z.infer<typeof paginationResponseSchema>;

export type PaginatedResponse<T> = PaginationResponse & { data: T[] };

export const dateFilteredPaginationQuerySchema = z.intersection(
  paginationQuerySchema,
  dateFilteredQuerySchema,
);

export type DateFilteredPaginationQuery = z.infer<
  typeof dateFilteredPaginationQuerySchema
>;
