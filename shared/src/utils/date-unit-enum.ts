import z from 'zod';

export const dateUnitEnum = z.enum(['day', 'week', 'month', 'year']);
export type DateUnit = z.infer<typeof dateUnitEnum>;
