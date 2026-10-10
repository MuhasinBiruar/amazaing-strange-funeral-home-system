import { z } from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

export const casketInventorySchema = z.object({
  casketid: z.int32(),
  caskettype: z.string(),
  caskettier: z.string().nullable(),
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

/** Casket tiers; the same values as a package's `packagetype`. */
export const casketTierEnum = z.enum(
  ['Basic', 'OG', 'Metal Casket', 'High End'],
  {
    error: 'Select a tier.',
  },
);

export type CasketTier = z.infer<typeof casketTierEnum>;

/**
 * @remarks
 * No `currentstock`: a new casket starts at 0 and stock only changes through
 * deliveries (which add) and contracts (which consume), so it can't be set or
 * edited directly.
 */
export const createCasketInventoryQuerySchema = z.object({
  caskettype: z
    .string()
    .trim()
    .min(1, 'Casket name is required.')
    .max(255, 'Casket name is too long.'),
  caskettier: casketTierEnum,
  minimumthreshold: z
    .int32({ error: 'Minimum must be a whole number.' })
    .nonnegative('Minimum cannot be negative.'),
});

export type CreateCasketInventoryQuery = z.infer<
  typeof createCasketInventoryQuerySchema
>;

export const updateCasketInventoryQuerySchema =
  createCasketInventoryQuerySchema.partial();

export type UpdateCasketInventoryQuery = z.infer<
  typeof updateCasketInventoryQuerySchema
>;

export const casketInventoryResponseSchema = z.object({
  data: casketInventorySchema,
});

export type CasketInventoryResponse = z.infer<
  typeof casketInventoryResponseSchema
>;

/**
 * A casket inventory table row. Carries every column (not just the ones the
 * table shows) so a row can be edited without refetching it.
 */
export const casketInventoryTableSchema = casketInventorySchema;

export type CasketInventoryTable = z.infer<typeof casketInventoryTableSchema>;

export const getPaginatedCasketInventoryQuerySchema =
  paginationQuerySchema.extend({
    search: z.string().optional(),
    sortBy: z
      .enum(['casketid', 'caskettype', 'currentstock'])
      .default('caskettype'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  });

export type GetPaginatedCasketInventoryQuery = z.infer<
  typeof getPaginatedCasketInventoryQuerySchema
>;

export const getPaginatedCasketInventoryResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(casketInventoryTableSchema),
  });

export type GetPaginatedCasketInventoryResponse = z.infer<
  typeof getPaginatedCasketInventoryResponseSchema
>;
