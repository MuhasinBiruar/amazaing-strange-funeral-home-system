import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

/**
 * A `casketdelivery` row joined with the `casketinventory` item it restocked.
 *
 * @remarks
 * `casketdelivery` only stores `casketid`; `caskettype` and `caskettier` come
 * from `casketinventory` and are `null` when the delivery isn't linked to an
 * inventory item. `unitcost` is `totalamountpaid / quantityreceived` (`null`
 * when nothing was received).
 */
export const casketDeliverySchema = z.object({
  deliveryid: z.int32(),
  quantityreceived: z.int32().nonnegative(),
  deliverydate: z.coerce.date(),
  casketid: z.int32().nullable(),
  totalamountpaid: z.float64().nonnegative(),
  caskettype: z.string().nullable(),
  caskettier: z.string().nullable(),
  unitcost: z.float64().nullable(),
});

export type CasketDelivery = z.infer<typeof casketDeliverySchema>;

export const createCasketDeliveryQuerySchema = casketDeliverySchema
  .pick({ deliverydate: true, totalamountpaid: true })
  .extend({
    casketid: z.int32({ error: 'Select a casket.' }),
    quantityreceived: z
      .int32({ error: 'Quantity must be a whole number.' })
      .positive('Quantity must be greater than zero.'),
  });

export type CreateCasketDeliveryQuery = z.infer<
  typeof createCasketDeliveryQuerySchema
>;

export const getCasketDeliveriesQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().optional(),
    tier: z.string().optional(),
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

export const createCasketDeliveryResponseSchema = z.object({
  data: casketDeliverySchema,
  /** Set when the casket is still at or below its minimum after the delivery. */
  warning: z.string().nullable(),
});

export type CreateCasketDeliveryResponse = z.infer<
  typeof createCasketDeliveryResponseSchema
>;

export type GetCasketDeliveryResponse = z.infer<
  typeof getCasketDeliveryResponseSchema
>;
