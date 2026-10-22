import z from 'zod';

export const formalinInventorySchema = z.object({
  formalinid: z.int32(),
  currentstock: z.float64().nonnegative(),
  minimumthreshold: z.float64().nonnegative(),
  date: z.coerce.date(),
});

export type FormalinInventory = z.infer<typeof formalinInventorySchema>;

export const getFormalinInventoryResponseSchema = z.object({
  data: formalinInventorySchema,
});

export type GetFormalinInventoryResponse = z.infer<
  typeof getFormalinInventoryResponseSchema
>;
