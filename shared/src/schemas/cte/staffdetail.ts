import z from 'zod';
import { staffWithAccessSchema } from '../db/staff';

/**
 * For the create/edit side panel.
 */
export const staffDetailSchema = staffWithAccessSchema
  .omit({ name: true })
  .extend({
    /** Only life plan agents have a linked company. */
    companyid: z.int32().nullable(),
    companyname: z.string().nullable(),
  });

export type StaffDetail = z.infer<typeof staffDetailSchema>;

export const getStaffDetailResponseSchema = z.object({
  data: staffDetailSchema,
});

export type GetStaffDetailResponse = z.infer<
  typeof getStaffDetailResponseSchema
>;
