import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  seedTestBatch,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'
import { shouldCreateAlert } from '~/features/batches/alert-service'

describe('Alert Service - Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  describe('shouldCreateAlert - deduplication', () => {
    it('Property 12: Should not create duplicate alerts within 24 hours', async () => {
      const db = getTestDb()
      const { userId } = await seedTestUser({ email: 'test@example.com' })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, { species: 'broiler' })
      
      // Create first alert
      await db
        .insertInto('notifications')
        .values({
          userId,
          farmId,
          type: 'growthDeviation',
          title: 'Test Alert',
          message: 'Test message',
          metadata: { batchId } as any,
          read: false,
        })
        .execute()
      
      // Check if should create another alert (should be false)
      const shouldCreate = await shouldCreateAlert(db, batchId, 'growthDeviation')
      
      expect(shouldCreate).toBe(false)
    })

    it('should allow alert creation after 24 hours', async () => {
      const db = getTestDb()
      const { userId } = await seedTestUser({ email: 'test@example.com' })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, { species: 'broiler' })
      
      // Create old alert (25 hours ago)
      const oldDate = new Date()
      oldDate.setHours(oldDate.getHours() - 25)
      
      await db
        .insertInto('notifications')
        .values({
          userId,
          farmId,
          type: 'growthDeviation',
          title: 'Old Alert',
          message: 'Old message',
          metadata: { batchId } as any,
          read: false,
          createdAt: oldDate,
        })
        .execute()
      
      // Check if should create new alert (should be true)
      const shouldCreate = await shouldCreateAlert(db, batchId, 'growthDeviation')
      
      expect(shouldCreate).toBe(true)
    })

    it('should allow different alert types for same batch', async () => {
      const db = getTestDb()
      const { userId } = await seedTestUser({ email: 'test@example.com' })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, { species: 'broiler' })
      
      // Create growthDeviation alert
      await db
        .insertInto('notifications')
        .values({
          userId,
          farmId,
          type: 'growthDeviation',
          title: 'Growth Alert',
          message: 'Growth message',
          metadata: { batchId } as any,
          read: false,
        })
        .execute()
      
      // Check if should create earlyHarvest alert (should be true - different type)
      const shouldCreate = await shouldCreateAlert(db, batchId, 'earlyHarvest')
      
      expect(shouldCreate).toBe(true)
    })

    it('should allow alerts for different batches', async () => {
      const db = getTestDb()
      const { userId } = await seedTestUser({ email: 'test@example.com' })
      const { farmId } = await seedTestFarm(userId)
      const { batchId: batchId1 } = await seedTestBatch(farmId, { species: 'broiler' })
      const { batchId: batchId2 } = await seedTestBatch(farmId, { species: 'layer' })
      
      // Create alert for batch 1
      await db
        .insertInto('notifications')
        .values({
          userId,
          farmId,
          type: 'growthDeviation',
          title: 'Batch 1 Alert',
          message: 'Batch 1 message',
          metadata: { batchId: batchId1 } as any,
          read: false,
        })
        .execute()
      
      // Check if should create alert for batch 2 (should be true - different batch)
      const shouldCreate = await shouldCreateAlert(db, batchId2, 'growthDeviation')
      
      expect(shouldCreate).toBe(true)
    })
  })

  afterEach(async () => {
    await closeTestDb()
  })
})
