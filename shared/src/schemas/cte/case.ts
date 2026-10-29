import z from 'zod';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { deceasedRecordSchema } from '../db/deceasedrecord';

export const caseSchema = z.object({
  deceased_name: z.string(),
  representative_name: z.string(),
  burialdatedeadline: z.coerce.date().nullable(),
  dateofdeath: z.coerce.date().nullable(),
  total_pending_docs: z.int(),
  totalamount: z.number().nullable(),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  plantype: deceasedRecordSchema.shape.plantype,
  datecreated: z.coerce.date(),
  managed_by_name: z.string(),
  caseid: z.int(),
  contractid: z.int(),
  representativeid: z.int().nullable(),
  staffid: z.string(),
  total_formalin_used: z.number().nonnegative().default(0),
  last_formalin_use_date: z.coerce.date().nullable().default(null),
});

export type Case = z.infer<typeof caseSchema>;

export const getCasesQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    status: caseSchema.shape.servicestatus.optional(),
    plantype: caseSchema.shape.plantype.optional(),
    sortBy: z.keyof(caseSchema).default('caseid'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
);

export type GetCasesQuery = z.infer<typeof getCasesQuerySchema>;

export const getCasesResponseSchema = paginationResponseSchema.extend({
  data: z.array(caseSchema),
});

export type GetCasesResponse = z.infer<typeof getCasesResponseSchema>;
