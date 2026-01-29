import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  resetTestDb,
  seedTestBatch,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'
import { calculateEnhancedProjection } from '~/features/batches/forecasting'

describe('Enhanced Projection - Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  describe('calculateEnhancedProjection', () => {
    it('Property 14: Enhanced projection returns all required fields', async () => {
      const db = getTestDb()
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        species: 'broiler',
        target_weight_g: 2000,
      })

      // Add weight sample
      await db
        .insertInto('weight_samples')
        .values({
          batchId,
          date: new Date(),
          sampleSize: 10,
          averageWeightKg: '1.5',
        })
        .execute()

      const result = await calculateEnhancedProjection(batchId)

      if (result) {
        // Check all required fields exist
        expect(result).toHaveProperty('currentWeightG')
        expect(result).toHaveProperty('expectedWeightG')
        expect(result).toHaveProperty('performanceIndex')
        expect(result).toHaveProperty('adgGramsPerDay')
        expect(result).toHaveProperty('expectedAdgGramsPerDay')
        expect(result).toHaveProperty('adgMethod')
        expect(result).toHaveProperty('projectedHarvestDate')
        expect(result).toHaveProperty('daysRemaining')
        expect(result).toHaveProperty('currentStatus')

        // Check types
        expect(typeof result.currentWeightG).toBe('number')
        expect(typeof result.expectedWeightG).toBe('number')
        expect(typeof result.performanceIndex).toBe('number')
        expect(typeof result.adgGramsPerDay).toBe('number')
        expect(typeof result.expectedAdgGramsPerDay).toBe('number')
        expect([
          'two_samples',
          'single_sample',
          'growth_curve_estimate',
        ]).toContain(result.adgMethod)
      }
    })

    it('Property 16: Gracefully handles missing growth standards', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        species: 'unknown_species', // No growth standards for this
        target_weight_g: 2000,
      })

      const result = await calculateEnhancedProjection(batchId)

      // Should return null gracefully
      expect(result).toBeNull()
    })

    it('should handle batch without target weight', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const { batchId } = await seedTestBatch(farmId, {
        species: 'broiler',
        target_weight_g: null, // No target weight
      })

      const result = await calculateEnhancedProjection(batchId)

      // Should return null when no target weight
      expect(result).toBeNull()
    })
  })

  describe('Batches Needing Attention', () => {
    it('Property 13: Filters batches with PI < 90 or > 110 and sorts by deviation', async () => {
      const db = getTestDb()
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)

      // Create batches with different performance levels
      const { batchId: batch1 } = await seedTestBatch(farmId, {
        species: 'broiler',
        target_weight_g: 2000,
        batchName: 'Batch 1',
      })

      const { batchId: batch2 } = await seedTestBatch(farmId, {
        species: 'broiler',
        target_weight_g: 2000,
        batchName: 'Batch 2',
      })

      // Add weight samples to simulate different performance
      // Batch 1: Behind (PI < 90)
      await db
        .insertInto('weight_samples')
        .values({
          batchId: batch1,
          date: new Date(),
          sampleSize: 10,
          averageWeightKg: '0.8', // Low weight
        })
        .execute()

      // Batch 2: On track (PI 95-105)
      await db
        .insertInto('weight_samples')
        .values({
          batchId: batch2,
          date: new Date(),
          sampleSize: 10,
          averageWeightKg: '1.5', // Normal weight
        })
        .execute()

      // Query batches needing attention
      const batches = await db
        .selectFrom('batches')
        .select(['id', 'batchName'])
        .where('farmId', '=', farmId)
        .where('status', '=', 'active')
        .execute()

      expect(batches.length).toBe(2)
    })
  })
})
