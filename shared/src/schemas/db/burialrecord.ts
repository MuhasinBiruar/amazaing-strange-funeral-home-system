import { z } from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import { deceasedRecordSchema } from './deceasedrecord';
import { dateFilteredPaginationQuerySchema } from '@/utils/pagination-schema';

export const createBurialRecordQuerySchema = z.object({
  burialdate: withNullDefault(z.coerce.date()),
  burialsite: withNullDefault(z.string().min(1)),
  caseid: z.int32(),
});

export type CreateBurialRecordQuery = z.infer<
  typeof createBurialRecordQuerySchema
>;

export const updateBurialRecordQuerySchema =
  createBurialRecordQuerySchema.omit({ caseid: true }).partial();

export type UpdateBurialRecordQuery = z.infer<
  typeof updateBurialRecordQuerySchema
>;

export const burialRecordSchema = createBurialRecordQuerySchema.extend({
  burialid: z.int32(),
  deceased_name: z.string(),
  servicestatus: deceasedRecordSchema.shape.servicestatus,
  plantype: deceasedRecordSchema.shape.plantype,
});

export type BurialRecord = z.infer<typeof burialRecordSchema>;

export const getBurialRecordsQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    status: deceasedRecordSchema.shape.servicestatus.optional(),
    plantype: deceasedRecordSchema.shape.plantype.optional(),
    sortBy: z
      .enum(['burialdate', 'burialsite', 'deceased_name', 'caseid'])
      .default('burialdate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export type GetBurialRecordsQuery = z.infer<
  typeof getBurialRecordsQuerySchema
>;

export const getBurialRecordsResponseSchema = z.object({
  data: z.array(burialRecordSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});
