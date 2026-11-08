import z from 'zod';
import { contractSchema } from '../db/contract';
import { deceasedRecordSchema } from '../db/deceasedrecord';
import { representativeSchema } from '../db/representative';
import { casePlanSchema } from './caseplan';

/**
 * Combination of the following tables:
 * `deceasedrecord` + `representative` + `contract` + the case's plan
 * (see {@link casePlanSchema})
 *
 * @remarks
 * A read-only view of one case. `managedby` is left out because life plan
 * agents can see this too.
 */
export const casePreviewSchema = z.object({
  deceased: deceasedRecordSchema.omit({ managedby: true }),
  representative: representativeSchema.nullable(),
  plan: casePlanSchema,
  contract: contractSchema.nullable(),
});

export type CasePreview = z.infer<typeof casePreviewSchema>;

export const getCasePreviewResponseSchema = z.object({
  data: casePreviewSchema,
});
