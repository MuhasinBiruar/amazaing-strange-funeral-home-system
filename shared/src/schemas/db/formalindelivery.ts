import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

export const formalinDeliverySchema = z.object({
  deliveryid: z.int32(),
  quantityreceived: z.float64().nonnegative(),
  deliverydate: z.coerce.date(),
  formalinid: z.int32().nullable(),
  totalamountpaid: z.float64().nonnegative(),
});

export type FormalinDelivery = z.infer<typeof formalinDeliverySchema>;

export const createFormalinDeliveryQuerySchema = formalinDeliverySchema
  .omit({ deliveryid: true })
  .extend({
    formalinid: withNullDefault(z.int32()),
  });

export type CreateFormalinDeliveryQuery = z.infer<
  typeof createFormalinDeliveryQuerySchema
>;

export const getFormalinDeliveriesQuerySchema = paginationQuerySchema
  .extend({
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

export type GetFormalinDeliveryResponse = z.infer<
  typeof getFormalinDeliveryResponseSchema
>;
