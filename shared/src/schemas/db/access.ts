import z from 'zod';

export const accessPageEnum = z.enum([
  'intake_page',
  'case_page',
  'special_case_page',
  'inventory_page',
  'financial_page',
]);

export type AccessPage = z.infer<typeof accessPageEnum>;

export function getAccessPageLabel(key: string): string {
  return key
    .replace(/_page$/, '')
    .split('_')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export const accessSchema = z.object({
  accessid: z.int32().min(1),
  staffid: z.string().trim().min(1),
  intake_page: z.boolean().default(false),
  case_page: z.boolean().default(false),
  special_case_page: z.boolean().default(false),
  inventory_page: z.boolean().default(false),
  financial_page: z.boolean().default(false),
});

export type Access = z.infer<typeof accessSchema>;

export const createAccessQuerySchema = accessSchema.omit({
  accessid: true,
});

export type CreateAccessQuery = z.infer<typeof createAccessQuerySchema>;

export const updateAccessQuerySchema = accessSchema.omit({
  accessid: true,
  staffid: true,
});

export type UpdateAccessQuery = z.infer<typeof updateAccessQuerySchema>;

export const DEFAULT_ACCESS: UpdateAccessQuery = Object.fromEntries(
  accessPageEnum.options.map((key) => [key, false]),
) as UpdateAccessQuery;
