import { z } from 'zod';
import { withNullDefault } from '../utils/with-null-default';

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
 * A package row plus its linked casket's display details, joined in by
 * `GET /packages` so the guided picker can show what casket an existing
 * package uses without a follow-up request. `casketid` can predate this
 * feature and be unset — hence the nullable joined fields.
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
