import { z } from 'zod';
import withNullDefault from './util/with-null-default';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const createDeceasedRecordQuerySchema = z.object({
  firstname: z.string().min(1),
  middlename: withNullDefault(z.string().min(1)),
  lastname: z.string().min(1),
  causeofdeath: withNullDefault(z.string().min(1)),
  typeofdeath: withNullDefault(z.string().min(1)),
  physicaldescription: withNullDefault(z.string().min(1)),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  hasmaturedlifeplan: z.boolean(),
  plantype: z.enum(['Direct', 'Life', 'LGU']),
  datecreated: z.coerce.date(),
  dateofdeath: withNullDefault(z.coerce.date()),
  managedby: withNullDefault(z.string().min(1)),
  representedby: withNullDefault(z.int32()),
});

export type CreateDeceasedRecordQuery = z.infer<
  typeof createDeceasedRecordQuerySchema
>;

/**
 * A deceased record that has no contract yet, joined with its representative
 * and managing staff.
 *
 * @remarks
 * Contract is 1:1 with case (see the `contract_caseid_key` unique constraint),
 * so these are exactly the records eligible for a new contract. They are the
 * complement of `GET /cases`, which inner-joins `contract` and therefore only
 * ever shows records that already have one.
 *
 * Carries the panel's detail fields alongside the table's columns so selecting
 * a row needs no follow-up request.
 */
export const uncontractedDeceasedSchema = z.object({
  caseid: z.int32(),
  deceased_name: z.string(),
  representative_name: z.string(),
  representative_contact: z.string().nullable(),
  causeofdeath: z.string().nullable(),
  typeofdeath: z.string().nullable(),
  physicaldescription: z.string().nullable(),
  servicestatus: createDeceasedRecordQuerySchema.shape.servicestatus,
  hasmaturedlifeplan: z.boolean(),
  plantype: createDeceasedRecordQuerySchema.shape.plantype,
  datecreated: z.coerce.date(),
  managed_by_name: z.string(),
});

export type UncontractedDeceased = z.infer<typeof uncontractedDeceasedSchema>;

export const getUncontractedDeceasedQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: uncontractedDeceasedSchema.shape.servicestatus.optional(),
  sortBy: z.keyof(uncontractedDeceasedSchema).default('caseid'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetUncontractedDeceasedQuery = z.infer<
  typeof getUncontractedDeceasedQuerySchema
>;

export const getUncontractedDeceasedResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(uncontractedDeceasedSchema),
  });

export type GetUncontractedDeceasedResponse = z.infer<
  typeof getUncontractedDeceasedResponseSchema
>;
