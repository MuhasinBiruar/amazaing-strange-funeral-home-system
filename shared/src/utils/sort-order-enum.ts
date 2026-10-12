import z from 'zod';

export const sortOrderEnum = z.enum(['asc', 'desc']);

export type SortOrder = z.infer<typeof sortOrderEnum>;
