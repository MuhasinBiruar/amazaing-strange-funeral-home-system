import { z } from 'zod';

export const casketInventorySchema = z.object({
  casketid: z.int32(),
  caskettype: z.string(),
  packagetier: z.string().nullable(),
  currentstock: z.int32(),
  minimumthreshold: z.int32(),
});

export type CasketInventory = z.infer<typeof casketInventorySchema>;

export const getCasketInventoryResponseSchema = z.object({
  data: z.array(casketInventorySchema),
});

export type GetCasketInventoryResponse = z.infer<
  typeof getCasketInventoryResponseSchema
>;
