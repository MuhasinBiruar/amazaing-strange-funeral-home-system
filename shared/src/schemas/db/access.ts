import z from 'zod';

export const accessSchema = z.object({
  accessid: z.int32().min(1),
  staffid: z.string().trim().min(1),
  intake_page: z.boolean().default(false),
  case_page: z.boolean().default(false),
  special_case_page: z.boolean().default(false),
  inventory_page: z.boolean().default(false),
  financial_page: z.boolean().default(false),
  admin_page: z.boolean().default(false),
});

export type Access = z.infer<typeof accessSchema>;

export const CreateAccessQuerySchema = accessSchema.omit({
  accessid: true,
});

export type CreateAccessQuery = z.infer<typeof CreateAccessQuerySchema>;

export const UpdateAccessQuerySchema = accessSchema.omit({
  staffid: true,
});

export type UpdateAccessQuery = z.infer<typeof UpdateAccessQuerySchema>;
