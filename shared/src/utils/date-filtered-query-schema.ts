import z from 'zod';

export const dateFilteredQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.iso.datetime().or(z.iso.date()).optional(),
  })
  .refine(
    ({ startDate, endDate }) =>
      !startDate || !endDate || startDate <= new Date(endDate),
    {
      message: 'endDate must be on or after startDate.',
      path: ['endDate'],
    },
  );

export type DateFilteredQuery = z.infer<typeof dateFilteredQuerySchema>;
