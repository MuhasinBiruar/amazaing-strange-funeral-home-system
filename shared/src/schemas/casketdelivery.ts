import z from 'zod';
import { withNullDefault } from '../utils/with-null-default';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '../utils/pagination-schema';

export const casketDeliverySchema = z.object({
  deliveryid: z.int32(),
  caskettype: z.string().trim().min(1).max(255),
  quantityreceived: z.int32().nonnegative(),
  deliverydate: z.coerce.date(),
  casketid: z.int32().nullable(),
  totalamountpaid: z.float64().nonnegative(),
});

export type CasketDelivery = z.infer<typeof casketDeliverySchema>;

export const createCasketDeliveryQuerySchema = casketDeliverySchema
  .omit({ deliveryid: true })
  .extend({
    casketid: withNullDefault(z.int32()),
  });

export type CreateCasketDeliveryQuery = z.infer<
  typeof createCasketDeliveryQuerySchema
>;

export const getCasketDeliveriesQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.iso.datetime().or(z.iso.date()).optional(),
    sortBy: z.keyof(casketDeliverySchema).default('deliverydate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.startDate <= new Date(data.endDate),
    {
      message: 'endDate must be on or after startDate.',
      path: ['endDate'],
    },
  );

export type GetCasketDeliveriesQuery = z.infer<
  typeof getCasketDeliveriesQuerySchema
>;

export const getCasketDeliveriesResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(casketDeliverySchema),
  });

export type GetCasketDeliveriesResponse = z.infer<
  typeof getCasketDeliveriesResponseSchema
>;

export const getCasketDeliveryResponseSchema = z.object({
  data: casketDeliverySchema,
});

export type GetCasketDeliveryResponse = z.infer<
  typeof getCasketDeliveryResponseSchema
>;
