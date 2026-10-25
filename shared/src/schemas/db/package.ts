import { z } from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

export const createPackageQuerySchema = z.object({
  packagename: z.string().min(1).max(255),
  packagetype: z.enum(['Basic', 'OG', 'Metal Casket', 'High End']),
  price: z.float64(),
  embalmingperiod: z.int32(),
  inclusions: withNullDefault(z.string().min(1)),
  casketid: z.int32(),
});

export type CreatePackageQuery = z.infer<typeof createPackageQuerySchema>;

export const packageSchema = createPackageQuerySchema.extend({
  packageid: z.int32(),
  // Nullable for reads only: casketid is required going forward (see
  // createPackageQuerySchema above), but a handful of packages created
  // before this feature existed still have it unset in the database.
  casketid: z.int32().nullable(),
});

export type Package = z.infer<typeof packageSchema>;

/**
 * A package row with its linked casket's display details. `GET /packages`
 * includes these details so the guided picker can show which casket a package
 * uses without another request. Older packages may not have a `casketid`, so
 * the casket details are nullable.
 */
export const packageWithCasketSchema = packageSchema.extend({
  caskettype: z.string().nullable(),
  casket_currentstock: z.int32().nullable(),
});

export type PackageWithCasket = z.infer<typeof packageWithCasketSchema>;

export const getPackagesResponseSchema = z.object({
  data: z.array(packageWithCasketSchema),
});

export type GetPackagesResponse = z.infer<typeof getPackagesResponseSchema>;
