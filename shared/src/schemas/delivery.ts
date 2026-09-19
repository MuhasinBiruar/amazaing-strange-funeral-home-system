import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '../utils/pagination-schema';

export const deliverySourceEnum = z.enum(['casket', 'formalin']);
export type DeliverySource = z.infer<typeof deliverySourceEnum>;

/**
 * `casketdelivery` row + `formalindelivery` row = `delivery` row
 *
 * @remarks
 * `deliveryid` is only unique *within* its own source table (each is a
 * separate `serial` sequence), so `source` + `deliveryid` together are this
 * row's real identity.
 */
export const deliverySchema = z.object({
  deliveryid: z.int32(),
  source: deliverySourceEnum,
  item_type: z.string(),
  quantityreceived: z.float64(),
  deliverydate: z.coerce.date(),
  totalamountpaid: z.float64(),
});

export type Delivery = z.infer<typeof deliverySchema>;

export const getDeliveriesQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().optional(),
    source: deliverySourceEnum.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.iso.datetime().or(z.iso.date()).optional(),
    sortBy: z.keyof(deliverySchema).default('deliverydate'),
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

export type GetDeliveriesQuery = z.infer<typeof getDeliveriesQuerySchema>;

export const getDeliveriesResponseSchema = paginationResponseSchema.extend({
  data: z.array(deliverySchema),
});

export type GetDeliveriesResponse = z.infer<typeof getDeliveriesResponseSchema>;
