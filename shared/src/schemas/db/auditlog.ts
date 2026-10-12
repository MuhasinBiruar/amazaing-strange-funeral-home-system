import { z } from 'zod';

/** An audit action recorded for a staff member. */
export const auditLogSchema = z.object({
  auditlogid: z.int32(),
  actiondate: z.coerce.date(),
  action: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const getAuditLogsResponseSchema = z.object({
  data: z.array(auditLogSchema),
});

export type GetAuditLogsResponse = z.infer<typeof getAuditLogsResponseSchema>;
