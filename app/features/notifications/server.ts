import { createServerFn } from '@tanstack/react-start'
import type { CreateNotificationData, Notification } from './types'

/**
 * Persistence layer for system notifications.
 *
 * @param data - Target user and content of the notification
 * @returns Promise resolving to the unique notification ID
 */
export async function createNotification(
  data: CreateNotificationData,
): Promise<string> {
  const { db } = await import('~/lib/db')

  const result = await db
    .insertInto('notifications')
    .values({
      userId: data.userId,
      farmId: data.farmId || null,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl || null,
      metadata: data.metadata || null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

/**
 * Get notifications for a user.
 *
 * @param userId - The ID of the user.
 * @param options - Filtering and pagination options.
 * @param options.unreadOnly - If true, returns only unread notifications.
 * @param options.limit - Maximum number of notifications to return.
 * @returns A promise resolving to a list of notifications.
 */
export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<Array<Notification>> {
  const { db } = await import('~/lib/db')

  let query = db
    .selectFrom('notifications')
    .selectAll()
    .where('userId', '=', userId)
    .orderBy('createdAt', 'desc')

  if (options?.unreadOnly) {
    query = query.where('read', '=', false)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const results = await query.execute()
  return results as Array<Notification>
}

/**
 * Mark a specific notification as read.
 *
 * @param notificationId - The ID of the notification.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  await db
    .updateTable('notifications')
    .set({ read: true })
    .where('id', '=', notificationId)
    .execute()
}

/**
 * Mark all notifications as read for a specific user.
 *
 * @param userId - The ID of the user.
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  await db
    .updateTable('notifications')
    .set({ read: true })
    .where('userId', '=', userId)
    .where('read', '=', false)
    .execute()
}

/**
 * Delete a notification.
 *
 * @param notificationId - The ID of the notification to delete.
 */
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')

  await db
    .deleteFrom('notifications')
    .where('id', '=', notificationId)
    .execute()
}

// Server functions for client-side calls

/**
 * Server function to get notifications.
 */
export const getNotificationsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { unreadOnly?: boolean; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getNotifications(session.user.id, data)
  })

/**
 * Server function to mark a notification as read.
 */
export const markAsReadFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    return markAsRead(data.notificationId)
  })

/**
 * Server function to mark all notifications as read.
 */
export const markAllAsReadFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return markAllAsRead(session.user.id)
  },
)

/**
 * Server function to delete a notification.
 */
export const deleteNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    return deleteNotification(data.notificationId)
  })
