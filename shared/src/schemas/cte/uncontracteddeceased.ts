import z from 'zod';
import { deceasedRecordSchema } from '../db/deceasedrecord';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

/**
 * A deceased record that has no contract yet, joined with its representative,
 * managing staff, and (direct) lifeplan.
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
  lifeplan_totalamount: z.float64().nullable(),
  lifeplan_use_benefits: z.boolean().nullable(),
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
