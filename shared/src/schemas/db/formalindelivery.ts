import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

/**
 * A `formalindelivery` row.
 *
 * @remarks
 * `unitcost` is computed as `totalamountpaid / quantityreceived` (`null` when
 * nothing was received); it isn't a stored column.
 */
export const formalinDeliverySchema = z.object({
  deliveryid: z.int32(),
  quantityreceived: z.float64().nonnegative(),
  deliverydate: z.coerce.date(),
  formalinid: z.int32().nullable(),
  totalamountpaid: z.float64().nonnegative(),
  unitcost: z.float64().nullable(),
});

export type FormalinDelivery = z.infer<typeof formalinDeliverySchema>;

/**
 * @remarks
 * No `formalinid`: formalin stock is a ledger where the newest
 * `formalininventory` row is the current stock, so the server always adds the
 * delivery on top of that row (see `POST /deliveries/formalin`).
 */
export const createFormalinDeliveryQuerySchema = formalinDeliverySchema
  .pick({ deliverydate: true, totalamountpaid: true })
  .extend({
    quantityreceived: z
      .float64({ error: 'Quantity must be a number.' })
      .positive('Quantity must be greater than zero.'),
  });

export type CreateFormalinDeliveryQuery = z.infer<
  typeof createFormalinDeliveryQuerySchema
>;

export const getFormalinDeliveriesQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.iso.datetime().or(z.iso.date()).optional(),
    sortBy: z.keyof(formalinDeliverySchema).default('deliverydate'),
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

export type GetFormalinDeliveriesQuery = z.infer<
  typeof getFormalinDeliveriesQuerySchema
>;

export const getFormalinDeliveriesResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(formalinDeliverySchema),
  });

export type GetFormalinDeliveriesResponse = z.infer<
  typeof getFormalinDeliveriesResponseSchema
>;

export const getFormalinDeliveryResponseSchema = z.object({
  data: formalinDeliverySchema,
});

export const createFormalinDeliveryResponseSchema = z.object({
  data: formalinDeliverySchema,
  /** Set when stock is still at or below the minimum after the delivery. */
  warning: z.string().nullable(),
});

export type CreateFormalinDeliveryResponse = z.infer<
  typeof createFormalinDeliveryResponseSchema
>;

export type GetFormalinDeliveryResponse = z.infer<
  typeof getFormalinDeliveryResponseSchema
>;
