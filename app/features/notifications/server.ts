import { createServerFn } from '@tanstack/react-start'
import type { CreateNotificationData, Notification } from './types'

/**
 * Create a new notification
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
 * Get notifications for a user
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
 * Mark notification as read
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
 * Mark all notifications as read for a user
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
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  await db
    .deleteFrom('notifications')
    .where('id', '=', notificationId)
    .execute()
}

// Server functions for client-side calls
export const getNotificationsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { unreadOnly?: boolean; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return getNotifications(session.user.id, data)
  })

export const markAsReadFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    return markAsRead(data.notificationId)
  })

export const markAllAsReadFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    return markAllAsRead(session.user.id)
  })

export const deleteNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()
    return deleteNotification(data.notificationId)
  })
