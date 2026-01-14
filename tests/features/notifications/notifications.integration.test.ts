import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '~/lib/db'
import {
  createNotification,
  getNotifications,
} from '~/features/notifications/server'
import { getAllBatchAlerts } from '~/features/monitoring/alerts'

describe('Notification Integration Tests', () => {
  let testUserId: string
  let testFarmId: string
  let testBatchId: string

  beforeEach(async () => {
    // Create test user with notification preferences
    const user = await db
      .insertInto('users')
      .values({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'user',
        emailVerified: true,
      })
      .returning('id')
      .executeTakeFirstOrThrow()
    testUserId = user.id

    // Create user settings with notifications enabled
    await db
      .insertInto('user_settings')
      .values({
        userId: testUserId,
        currencyCode: 'USD',
        currencySymbol: '$',
        currencyDecimals: 2,
        currencySymbolPosition: 'before',
        thousandSeparator: ',',
        decimalSeparator: '.',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0,
        weightUnit: 'kg',
        areaUnit: 'sqm',
        temperatureUnit: 'celsius',
        language: 'en',
        theme: 'system',
        lowStockThresholdPercent: 20,
        mortalityAlertPercent: 10,
        mortalityAlertQuantity: 50,
        defaultPaymentTermsDays: 30,
        fiscalYearStartMonth: 1,
        notifications: {
          lowStock: true,
          highMortality: true,
          invoiceDue: true,
          batchHarvest: true,
        },
        dashboardCards: {
          inventory: true,
          revenue: true,
          expenses: true,
          profit: true,
          mortality: true,
          feed: true,
        },
      })
      .execute()

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

    // Create test batch
    const batch = await db
      .insertInto('batches')
      .values({
        farmId: testFarmId,
        livestockType: 'poultry',
        species: 'broiler',
        initialQuantity: 1000,
        currentQuantity: 800,
        acquisitionDate: new Date(),
        costPerUnit: '100',
        totalCost: '100000',
        status: 'active',
      })
      .returning('id')
      .executeTakeFirstOrThrow()
    testBatchId = batch.id
  })

  afterEach(async () => {
    // Cleanup
    await db
      .deleteFrom('notifications')
      .where('userId', '=', testUserId)
      .execute()
    await db
      .deleteFrom('mortality_records')
      .where('batchId', '=', testBatchId)
      .execute()
    await db.deleteFrom('batches').where('id', '=', testBatchId).execute()
    await db.deleteFrom('user_farms').where('userId', '=', testUserId).execute()
    await db.deleteFrom('farms').where('id', '=', testFarmId).execute()
    await db
      .deleteFrom('user_settings')
      .where('userId', '=', testUserId)
      .execute()
    await db.deleteFrom('users').where('id', '=', testUserId).execute()
  })

  describe('Mortality Alert → Notification Flow', () => {
    it('should create notification when high mortality detected', async () => {
      // Create high mortality record (20% of initial quantity)
      await db
        .insertInto('mortality_records')
        .values({
          batchId: testBatchId,
          quantity: 200,
          date: new Date(),
          cause: 'disease',
        })
        .execute()

      // Update batch quantity
      await db
        .updateTable('batches')
        .set({ currentQuantity: 800 })
        .where('id', '=', testBatchId)
        .execute()

      // Trigger alert system
      const alerts = await getAllBatchAlerts(testUserId, testFarmId)

      // Verify alert was created
      const mortalityAlert = alerts.find((a) => a.source === 'mortality')
      expect(mortalityAlert).toBeDefined()
      expect(mortalityAlert?.type).toBe('critical')

      // Verify notification was created
      const notifications = await getNotifications(testUserId)
      const mortalityNotification = notifications.find(
        (n) => n.type === 'highMortality',
      )

      expect(mortalityNotification).toBeDefined()
      expect(mortalityNotification?.title).toBe('High Mortality Alert')
      expect(mortalityNotification?.message).toContain('Mortality')
      expect(mortalityNotification?.actionUrl).toContain(testBatchId)
      expect(mortalityNotification?.read).toBe(false)
    })

    it('should respect user notification preferences', async () => {
      // Disable mortality notifications
      await db
        .updateTable('user_settings')
        .set({
          notifications: {
            lowStock: true,
            highMortality: false,
            invoiceDue: true,
            batchHarvest: true,
          },
        })
        .where('userId', '=', testUserId)
        .execute()

      // Create high mortality record
      await db
        .insertInto('mortality_records')
        .values({
          batchId: testBatchId,
          quantity: 200,
          date: new Date(),
          cause: 'disease',
        })
        .execute()

      await db
        .updateTable('batches')
        .set({ currentQuantity: 800 })
        .where('id', '=', testBatchId)
        .execute()

      // Trigger alert system
      await getAllBatchAlerts(testUserId, testFarmId)

      // Verify no notification was created
      const notifications = await getNotifications(testUserId)
      const mortalityNotification = notifications.find(
        (n) => n.type === 'highMortality',
      )

      expect(mortalityNotification).toBeUndefined()
    })

    it('should include metadata in notification', async () => {
      // Create high mortality record
      await db
        .insertInto('mortality_records')
        .values({
          batchId: testBatchId,
          quantity: 200,
          date: new Date(),
          cause: 'disease',
        })
        .execute()

      await db
        .updateTable('batches')
        .set({ currentQuantity: 800 })
        .where('id', '=', testBatchId)
        .execute()

      // Trigger alert system
      await getAllBatchAlerts(testUserId, testFarmId)

      // Verify notification metadata
      const notifications = await getNotifications(testUserId)
      const mortalityNotification = notifications.find(
        (n) => n.type === 'highMortality',
      )

      expect(mortalityNotification?.metadata).toBeDefined()
      expect(mortalityNotification?.metadata?.batchId).toBe(testBatchId)
      expect(mortalityNotification?.metadata?.species).toBe('broiler')
    })
  })

  describe('Multi-user Isolation', () => {
    it('should not show notifications to other users', async () => {
      // Create second user
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

      // Create notification for first user
      await createNotification({
        userId: testUserId,
        farmId: testFarmId,
        type: 'highMortality',
        title: 'Alert',
        message: 'Message',
      })

      // Verify second user doesn't see it
      const user2Notifications = await getNotifications(user2.id)
      expect(user2Notifications).toHaveLength(0)

      // Cleanup
      await db.deleteFrom('users').where('id', '=', user2.id).execute()
    })
  })
})
