import z from 'zod';
import { deceasedRecordSchema } from '../db/deceasedrecord';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

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
  caseid: deceasedRecordSchema.shape.caseid,
  deceased_name: z.string(),
  representative_name: z.string(),
  representative_contact: z.string().nullable(),
  causeofdeath: z.string().nullable(),
  typeofdeath: z.string().nullable(),
  physicaldescription: z.string().nullable(),
  servicestatus: deceasedRecordSchema.shape.servicestatus,
  hasmaturedlifeplan: deceasedRecordSchema.shape.hasmaturedlifeplan,
  plantype: deceasedRecordSchema.shape.plantype,
  datecreated: deceasedRecordSchema.shape.datecreated,
  managed_by_name: z.string(),
});

export type UncontractedDeceased = z.infer<typeof uncontractedDeceasedSchema>;

export const getUncontractedDeceasedQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: uncontractedDeceasedSchema.shape.servicestatus.optional(),
  // Exact match, unlike `search` (which is a fuzzy ILIKE) — for fetching one
  // specific record precisely, e.g. jumping straight to a just-created case.
  caseid: z.coerce.number().int().positive().optional(),
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
