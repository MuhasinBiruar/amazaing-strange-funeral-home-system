import { z } from 'zod';
import withNullDefault from './util/with-null-default';

export const createPackageQuerySchema = z.object({
  packagename: z.string().min(1).max(255),
  packagetype: z.enum(['Basic', 'OG', 'Metal Casket', 'High End']),
  price: z.float64(),
  embalmingperiod: z.int32(),
  inclusions: withNullDefault(z.string().min(1)),
});

export type CreatePackageQuery = z.infer<typeof createPackageQuerySchema>;
