import z from 'zod';
import { paginationResponseSchema } from '@/utils/pagination-schema';

export const formalinUsageSchema = z.object({
  usageid: z.int32(),
  quantityused: z.float64().positive(),
  usagedate: z.coerce.date(),
  casetype: z.string().nullable(),
  caseid: z.int32(),
  formalinid: z.int32(),
});

export type FormalinUsage = z.infer<typeof formalinUsageSchema>;

export const createFormalinUsageSchema = z.object({
  quantityused: z.float64().positive(),
  minimumthreshold: z.float64().nonnegative(),
  caseid: z.int32(),
  formalinid: z.int32(),
});

export type CreateFormalinUsage = z.infer<typeof createFormalinUsageSchema>;

export const formalinUsageResponseSchema = z.object({
  data: formalinUsageSchema,
  inventory: z.object({
    currentstock: z.float64().nonnegative(),
    minimumthreshold: z.float64().nonnegative(),
  }),
  warning: z.string().nullable(),
});

export type FormalinUsageResponse = z.infer<typeof formalinUsageResponseSchema>;

export const getFormalinUsageResponseSchema = paginationResponseSchema.extend({
  data: z.array(formalinUsageSchema),
});

export type GetFormalinUsageResponse = z.infer<
  typeof getFormalinUsageResponseSchema
>;
