import { z } from 'zod';
import { dateFilteredQuerySchema } from '@/utils';

export const notificationTypeEnum = z.enum([
  'documents_complete',
  'full_payment',
  'payment_reminder',
  'advanced_decomposition',
  'low_formalin',
  'low_casket',
  'expense_recorded',
  'service_completed',
]);

export type NotificationType = z.infer<typeof notificationTypeEnum>;

export const notificationCategoryEnum = z.enum([
  'docs',
  'payments',
  'completed',
  'stocks',
]);

export type NotificationCategory = z.infer<typeof notificationCategoryEnum>;

/** Which notification types each filter category in the bell covers. */
export const NOTIFICATION_CATEGORY_TYPES: Record<
  NotificationCategory,
  NotificationType[]
> = {
  docs: ['documents_complete'],
  payments: ['full_payment', 'payment_reminder', 'expense_recorded'],
  completed: ['service_completed'],
  stocks: ['low_casket', 'low_formalin', 'advanced_decomposition'],
};

/**
 * Notification types that are resolved by being read (by anyone who can see
 * them, one at a time or with "Mark all as read") rather than by a condition
 * clearing.
 */
export const NOTIFICATION_TYPES_RESOLVED_ON_READ: NotificationType[] = [
  'expense_recorded',
];

export const notificationReadStatusEnum = z.enum(['unread', 'read']);

export type NotificationReadStatus = z.infer<typeof notificationReadStatusEnum>;

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

/**
 * @remarks
 * `startDate`/`endDate` filter on `createdat`.
 */
export const getNotificationsQuerySchema = z.intersection(
  z.object({
    page: z.coerce.number().int().min(1).max(100).default(1),
    category: notificationCategoryEnum.optional(),
    readStatus: notificationReadStatusEnum.optional(),
  }),
  dateFilteredQuerySchema,
);

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

export const getNotificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
  meta: z.object({
    unreadCount: z.int32(),
    hasMore: z.boolean(),
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
