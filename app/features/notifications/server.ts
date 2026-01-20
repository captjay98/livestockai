import { createServerFn } from '@tanstack/react-start'
import type { CreateNotificationData, Notification } from './types'
import { AppError } from '~/lib/errors'

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

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create notification',
      cause: error,
    })
  }
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

  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch notifications',
      cause: error,
    })
  }
}

/**
 * Mark a specific notification as read.
 *
 * @param notificationId - The ID of the notification.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    await db
      .updateTable('notifications')
      .set({ read: true })
      .where('id', '=', notificationId)
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to mark notification as read',
      cause: error,
    })
  }
}

/**
 * Mark all notifications as read for a specific user.
 *
 * @param userId - The ID of the user.
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    await db
      .updateTable('notifications')
      .set({ read: true })
      .where('userId', '=', userId)
      .where('read', '=', false)
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to mark all notifications as read',
      cause: error,
    })
  }
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

  try {
    await db
      .deleteFrom('notifications')
      .where('id', '=', notificationId)
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete notification',
      cause: error,
    })
  }
}

// Server functions for client-side calls

/**
 * Server function to get notifications.
 */
export const getNotificationsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { unreadOnly?: boolean; limit?: number }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      return await getNotifications(session.user.id, data)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', { cause: error })
    }
  })

/**
 * Server function to mark a notification as read.
 */
export const markAsReadFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()
      return await markAsRead(data.notificationId)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', { cause: error })
    }
  })

/**
 * Server function to mark all notifications as read.
 */
export const markAllAsReadFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      return await markAllAsRead(session.user.id)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', { cause: error })
    }
  },
)

/**
 * Server function to delete a notification.
 */
export const deleteNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()
      return await deleteNotification(data.notificationId)
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', { cause: error })
    }
  })
