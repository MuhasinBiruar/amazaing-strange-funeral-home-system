import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';
import nameSchema from './util/name-schema.ts';
import contactNumberSchema from './util/contact-number-schema.ts';

export const representativeSchema = z.object({
  firstname: nameSchema('First name'),
  middlename: nameSchema('Middle name'),
  lastname: nameSchema('Last name'),
  relationship: withNullDefault(z.string().min(1)),
  contactNumber: contactNumberSchema,
  address: withNullDefault(z.string().min(1)),
  dateCreated: z.coerce.date(),
});

export type RepresentativeSchema = z.infer<typeof representativeSchema>;
