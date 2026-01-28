import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Digital Foreman notification types
 */
export type DigitalForemanNotificationType =
  | 'taskAssigned'
  | 'taskCompleted'
  | 'taskApproved'
  | 'taskRejected'
  | 'flaggedCheckIn'

/**
 * Data for creating a Digital Foreman notification
 */
export interface CreateDigitalForemanNotificationData {
  userId: string
  farmId: string
  type: DigitalForemanNotificationType
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, any>
}

/**
 * Create a Digital Foreman notification
 *
 * @param db - Kysely database instance
 * @param data - Notification data
 * @returns Promise resolving to the created notification ID
 */
export async function createDigitalForemanNotification(
  db: Kysely<Database>,
  data: CreateDigitalForemanNotificationData,
): Promise<string> {
  const result = await db
    .insertInto('notifications')
    .values({
      userId: data.userId,
      farmId: data.farmId,
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