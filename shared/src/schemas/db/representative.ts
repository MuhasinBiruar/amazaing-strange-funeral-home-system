import { z } from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import { nameSchema } from '@/utils/name-schema';
import { contactNumberSchema } from '@/utils/contact-number-schema';

export const representativeSchema = z.object({
  representativeid: z.int32(),
  firstname: nameSchema('First name'),
  middlename: nameSchema('Middle name'),
  lastname: nameSchema('Last name'),
  relationship: withNullDefault(z.string().min(1)),
  contactnumber: contactNumberSchema,
  address: withNullDefault(z.string().min(1)),
  datecreated: z.coerce.date(),
});

export type Representative = z.infer<typeof representativeSchema>;

export const createRepresentativeQuerySchema = representativeSchema.omit({
  representativeid: true,
});

export type CreateRepresentativeQuery = z.infer<
  typeof createRepresentativeQuerySchema
>;

export const updateRepresentativeQuerySchema =
  createRepresentativeQuerySchema.partial();

export type UpdateRepresentativeQuery = z.infer<
  typeof updateRepresentativeQuerySchema
>;

export const getRepresentativeResponseSchema = z.object({
  data: representativeSchema,
});

export type GetRepresentativeResponse = z.infer<
  typeof getRepresentativeResponseSchema
>;
