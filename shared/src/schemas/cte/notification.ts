import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'documents_complete',
  'full_payment',
  'payment_reminder',
  'advanced_decomposition',
  'low_formalin',
  'low_casket',
]);

export type NotificationType = z.infer<typeof notificationTypeEnum>;

/**
 * A notification as seen by one staff member: the shared `notification` row
 * plus whether *this* staff member has read it (`notificationread`).
 *
 * @remarks
 * `resolvedat` is set once the underlying condition clears (e.g. a low-stock
 * casket is restocked). Resolved notifications stay in the list as history.
 */
export const notificationSchema = z.object({
  notificationid: z.int32(),
  type: notificationTypeEnum,
  title: z.string(),
  message: z.string(),
  caseid: z.int32().nullable(),
  link: z.string().nullable(),
  createdat: z.coerce.date(),
  resolvedat: z.coerce.date().nullable(),
  isread: z.boolean(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const getNotificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
  meta: z.object({
    unreadCount: z.int32(),
  }),
});

export type GetNotificationsResponse = z.infer<
  typeof getNotificationsResponseSchema
>;

export const getUnreadNotificationCountResponseSchema = z.object({
  data: z.object({
    unreadCount: z.int32(),
  }),
});

export type GetUnreadNotificationCountResponse = z.infer<
  typeof getUnreadNotificationCountResponseSchema
>;
