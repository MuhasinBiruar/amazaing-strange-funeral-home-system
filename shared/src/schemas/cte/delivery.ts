import z from 'zod';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

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

export const getDeliveriesQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    source: deliverySourceEnum.optional(),
    sortBy: z.keyof(deliverySchema).default('deliverydate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export type GetDeliveriesQuery = z.infer<typeof getDeliveriesQuerySchema>;

export const getDeliveriesResponseSchema = paginationResponseSchema.extend({
  data: z.array(deliverySchema),
});

export type GetDeliveriesResponse = z.infer<typeof getDeliveriesResponseSchema>;
