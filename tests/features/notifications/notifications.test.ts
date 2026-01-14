import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '~/lib/db'
import {
  createNotification,
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '~/features/notifications/server'

describe('Notification Server Functions', () => {
  let testUserId: string
  let testUserId2: string
  let testFarmId: string

  beforeEach(async () => {
    // Create test users
    const user1 = await db
      .insertInto('users')
      .values({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'user',
        emailVerified: true,
      })
      .returning('id')
      .executeTakeFirstOrThrow()
    testUserId = user1.id

    const user2 = await db
      .insertInto('users')
      .values({
        email: `test2-${Date.now()}@example.com`,
        name: 'Test User 2',
        role: 'user',
        emailVerified: true,
      })
      .returning('id')
      .executeTakeFirstOrThrow()
    testUserId2 = user2.id

    // Create test farm
    const farm = await db
      .insertInto('farms')
      .values({
        name: 'Test Farm',
        location: 'Test Location',
        type: 'poultry',
      })
      .returning('id')
      .executeTakeFirstOrThrow()
    testFarmId = farm.id

    // Link user to farm
    await db
      .insertInto('user_farms')
      .values({
        userId: testUserId,
        farmId: testFarmId,
        role: 'owner',
      })
      .execute()
  })

  afterEach(async () => {
    // Cleanup
    await db
      .deleteFrom('notifications')
      .where('userId', 'in', [testUserId, testUserId2])
      .execute()
    await db.deleteFrom('user_farms').where('userId', '=', testUserId).execute()
    await db.deleteFrom('farms').where('id', '=', testFarmId).execute()
    await db
      .deleteFrom('users')
      .where('id', 'in', [testUserId, testUserId2])
      .execute()
  })

  describe('createNotification', () => {
    it('should create notification with all fields', async () => {
      const notificationId = await createNotification({
        userId: testUserId,
        farmId: testFarmId,
        type: 'highMortality',
        title: 'High Mortality Alert',
        message: 'Mortality rate exceeded threshold',
        actionUrl: '/batches/123',
        metadata: { batchId: '123', rate: 15 },
      })

      expect(notificationId).toBeTruthy()

      const notification = await db
        .selectFrom('notifications')
        .selectAll()
        .where('id', '=', notificationId)
        .executeTakeFirst()

      expect(notification).toBeDefined()
      expect(notification?.userId).toBe(testUserId)
      expect(notification?.farmId).toBe(testFarmId)
      expect(notification?.type).toBe('highMortality')
      expect(notification?.title).toBe('High Mortality Alert')
      expect(notification?.read).toBe(false)
    })

    it('should create notification without optional fields', async () => {
      const notificationId = await createNotification({
        userId: testUserId,
        type: 'lowStock',
        title: 'Low Stock',
        message: 'Feed inventory low',
      })

      const notification = await db
        .selectFrom('notifications')
        .selectAll()
        .where('id', '=', notificationId)
        .executeTakeFirst()

      expect(notification?.farmId).toBeNull()
      expect(notification?.actionUrl).toBeNull()
      expect(notification?.metadata).toBeNull()
    })
  })

  describe('getNotifications', () => {
    it('should return only user notifications', async () => {
      await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert 1',
        message: 'Message 1',
      })

      await createNotification({
        userId: testUserId2,
        type: 'lowStock',
        title: 'Alert 2',
        message: 'Message 2',
      })

      const notifications = await getNotifications(testUserId)

      expect(notifications).toHaveLength(1)
      expect(notifications[0].userId).toBe(testUserId)
    })

    it('should filter unread notifications', async () => {
      const id1 = await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Unread',
        message: 'Message',
      })

      const id2 = await createNotification({
        userId: testUserId,
        type: 'lowStock',
        title: 'Read',
        message: 'Message',
      })

      await markAsRead(id2)

      const unread = await getNotifications(testUserId, { unreadOnly: true })

      expect(unread).toHaveLength(1)
      expect(unread[0].id).toBe(id1)
    })

    it('should respect limit parameter', async () => {
      await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert 1',
        message: 'Message',
      })
      await createNotification({
        userId: testUserId,
        type: 'lowStock',
        title: 'Alert 2',
        message: 'Message',
      })
      await createNotification({
        userId: testUserId,
        type: 'invoiceDue',
        title: 'Alert 3',
        message: 'Message',
      })

      const limited = await getNotifications(testUserId, { limit: 2 })

      expect(limited).toHaveLength(2)
    })

    it('should order by createdAt desc', async () => {
      const id1 = await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'First',
        message: 'Message',
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const id2 = await createNotification({
        userId: testUserId,
        type: 'lowStock',
        title: 'Second',
        message: 'Message',
      })

      const notifications = await getNotifications(testUserId)

      expect(notifications[0].id).toBe(id2)
      expect(notifications[1].id).toBe(id1)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const id = await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert',
        message: 'Message',
      })

      await markAsRead(id)

      const notification = await db
        .selectFrom('notifications')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      expect(notification?.read).toBe(true)
    })

    it('should be idempotent', async () => {
      const id = await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert',
        message: 'Message',
      })

      await markAsRead(id)
      await markAsRead(id)

      const notification = await db
        .selectFrom('notifications')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      expect(notification?.read).toBe(true)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert 1',
        message: 'Message',
      })
      await createNotification({
        userId: testUserId,
        type: 'lowStock',
        title: 'Alert 2',
        message: 'Message',
      })

      await markAllAsRead(testUserId)

      const notifications = await getNotifications(testUserId)

      expect(notifications.every((n) => n.read)).toBe(true)
    })

    it('should not affect other users', async () => {
      await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert 1',
        message: 'Message',
      })
      await createNotification({
        userId: testUserId2,
        type: 'lowStock',
        title: 'Alert 2',
        message: 'Message',
      })

      await markAllAsRead(testUserId)

      const user2Notifications = await getNotifications(testUserId2)

      expect(user2Notifications[0].read).toBe(false)
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const id = await createNotification({
        userId: testUserId,
        type: 'highMortality',
        title: 'Alert',
        message: 'Message',
      })

      await deleteNotification(id)

      const notification = await db
        .selectFrom('notifications')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      expect(notification).toBeUndefined()
    })
  })
})
