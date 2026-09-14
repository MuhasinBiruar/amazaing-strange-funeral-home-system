import { z } from 'zod';
import withNullDefault from './util/with-null-default';
import nameSchema from './util/name-schema';
import contactNumberSchema from './util/contact-number-schema';

export const createRepresentativeQuerySchema = z.object({
  firstname: nameSchema('First name'),
  middlename: nameSchema('Middle name'),
  lastname: nameSchema('Last name'),
  relationship: withNullDefault(z.string().min(1)),
  contactnumber: contactNumberSchema,
  address: withNullDefault(z.string().min(1)),
  datecreated: z.coerce.date(),
});

export type CreateRepresentativeQuery = z.infer<
  typeof createRepresentativeQuerySchema
>;

export const representativeSchema = createRepresentativeQuerySchema.extend({
  representativeid: z.int32(),
});

export type Representative = z.infer<typeof representativeSchema>;

export const getRepresentativeResponseSchema = z.object({
  data: representativeSchema,
});

export type GetRepresentativeResponse = z.infer<
  typeof getRepresentativeResponseSchema
>;
