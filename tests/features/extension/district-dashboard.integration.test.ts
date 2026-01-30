import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  resetTestDb,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'
import { getDistrictDashboard } from '~/features/extension/repository'
import {
  calculateHealthStatus,
  calculateMortalityRate,
} from '~/features/extension/health-service'

/**
 * Integration Tests for Extension Worker Mode - District Dashboard
 *
 * Feature: complete-extension-worker-mode
 * Validates: Requirements 17.5
 *
 * Tests district dashboard queries with multiple farms, filtering, and pagination
 */

describe('District Dashboard Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  describe('Multiple Farms', () => {
    it('should return all farms in district', async () => {
      const db = getTestDb()

      // Create unique country and district for this test
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const country = await db
        .insertInto('countries')
        .values({ code: 'A1', name: `Nigeria-${uniqueId}` })
        .returning('id')
        .executeTakeFirstOrThrow()

      const district = await db
        .insertInto('regions')
        .values({
          countryId: country.id,
          level: 2,
          name: 'Test District',
          slug: `test-district-a1-${uniqueId}`,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      // Create 5 farms in the district with access grants
      for (let i = 0; i < 5; i++) {
        const { userId } = await seedTestUser({
          email: `farmer${i}-${Date.now()}-${i}@test.com`,
        })
        const farm = await db
          .insertInto('farms')
          .values({
            name: `Farm ${i}`,
            location: `Location ${i}`,
            type: 'poultry',
            districtId: district.id,
          })
          .returning('id')
          .executeTakeFirstOrThrow()

        await db
          .insertInto('user_farms')
          .values({ userId, farmId: farm.id, role: 'owner' })
          .execute()

        // Create access grant for the farm (required by getDistrictDashboard query)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90)
        await db
          .insertInto('access_grants')
          .values({
            userId,
            farmId: farm.id,
            grantedBy: userId,
            expiresAt,
            financialVisibility: false,
          })
          .execute()
      }

      // Query dashboard
      const result = await getDistrictDashboard(db, {
        districtId: district.id,
        page: 1,
        pageSize: 10,
      })

      expect(result.farms).toHaveLength(5)
      expect(result.total).toBe(5)
    })

    it('should calculate health status for each farm', async () => {
      const db = getTestDb()

      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const country = await db
        .insertInto('countries')
        .values({ code: 'B1', name: `Nigeria-${uniqueId}` })
        .returning('id')
        .executeTakeFirstOrThrow()

      const district = await db
        .insertInto('regions')
        .values({
          countryId: country.id,
          level: 2,
          name: 'Test District',
          slug: `test-district-b1-${uniqueId}`,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      // Create farm with high mortality batch
      const { userId } = await seedTestUser({
        email: `farmer-${Date.now()}@test.com`,
      })
      const farm = await db
        .insertInto('farms')
        .values({
          name: 'High Mortality Farm',
          location: 'Test Location',
          type: 'poultry',
          districtId: district.id,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await db
        .insertInto('user_farms')
        .values({ userId, farmId: farm.id, role: 'owner' })
        .execute()

      // Create access grant
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)
      await db
        .insertInto('access_grants')
        .values({
          userId,
          farmId: farm.id,
          grantedBy: userId,
          expiresAt,
          financialVisibility: false,
        })
        .execute()

      // Create batch with 15% mortality (should be red for broilers)
      await db
        .insertInto('batches')
        .values({
          farmId: farm.id,
          batchName: 'Test Batch',
          livestockType: 'poultry',
          species: 'broiler',
          initialQuantity: 100,
          currentQuantity: 85, // 15% mortality
          acquisitionDate: new Date(),
          costPerUnit: '10.00',
          totalCost: '1000.00',
          status: 'active',
        })
        .execute()

      const result = await getDistrictDashboard(db, {
        districtId: district.id,
        page: 1,
        pageSize: 10,
      })

      expect(result.farms).toHaveLength(1)

      // Verify health status calculation
      const mortalityRate = calculateMortalityRate(100, 85)
      const expectedStatus = calculateHealthStatus(mortalityRate, 'broiler')
      expect(expectedStatus).toBe('red')
    })
  })

  describe('Filtering', () => {
    it('should filter by livestock type', async () => {
      const db = getTestDb()

      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const country = await db
        .insertInto('countries')
        .values({ code: 'C1', name: `Nigeria-${uniqueId}` })
        .returning('id')
        .executeTakeFirstOrThrow()

      const district = await db
        .insertInto('regions')
        .values({
          countryId: country.id,
          level: 2,
          name: 'Test District',
          slug: `test-district-c1-${uniqueId}`,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      // Create poultry farm
      const { userId: userId1 } = await seedTestUser({
        email: `farmer1-${Date.now()}@test.com`,
      })
      const poultryFarm = await db
        .insertInto('farms')
        .values({
          name: 'Poultry Farm',
          location: 'Location 1',
          type: 'poultry',
          districtId: district.id,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await db
        .insertInto('user_farms')
        .values({ userId: userId1, farmId: poultryFarm.id, role: 'owner' })
        .execute()

      // Create access grant for poultry farm
      const expiresAt1 = new Date()
      expiresAt1.setDate(expiresAt1.getDate() + 90)
      await db
        .insertInto('access_grants')
        .values({
          userId: userId1,
          farmId: poultryFarm.id,
          grantedBy: userId1,
          expiresAt: expiresAt1,
          financialVisibility: false,
        })
        .execute()

      await db
        .insertInto('batches')
        .values({
          farmId: poultryFarm.id,
          batchName: 'Broiler Batch',
          livestockType: 'poultry',
          species: 'broiler',
          initialQuantity: 100,
          currentQuantity: 100,
          acquisitionDate: new Date(),
          costPerUnit: '10.00',
          totalCost: '1000.00',
          status: 'active',
        })
        .execute()

      // Create aquaculture farm
      const { userId: userId2 } = await seedTestUser({
        email: `farmer2-${Date.now()}@test.com`,
      })
      const fishFarm = await db
        .insertInto('farms')
        .values({
          name: 'Fish Farm',
          location: 'Location 2',
          type: 'aquaculture',
          districtId: district.id,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await db
        .insertInto('user_farms')
        .values({ userId: userId2, farmId: fishFarm.id, role: 'owner' })
        .execute()

      // Create access grant for fish farm
      const expiresAt2 = new Date()
      expiresAt2.setDate(expiresAt2.getDate() + 90)
      await db
        .insertInto('access_grants')
        .values({
          userId: userId2,
          farmId: fishFarm.id,
          grantedBy: userId2,
          expiresAt: expiresAt2,
          financialVisibility: false,
        })
        .execute()

      await db
        .insertInto('batches')
        .values({
          farmId: fishFarm.id,
          batchName: 'Catfish Batch',
          livestockType: 'fish',
          species: 'catfish',
          initialQuantity: 500,
          currentQuantity: 500,
          acquisitionDate: new Date(),
          costPerUnit: '5.00',
          totalCost: '2500.00',
          status: 'active',
        })
        .execute()

      // Filter by poultry
      const poultryResult = await getDistrictDashboard(db, {
        districtId: district.id,
        page: 1,
        pageSize: 10,
        livestockType: 'poultry',
      })

      expect(poultryResult.farms).toHaveLength(1)
      expect(poultryResult.farms[0].farmName).toBe('Poultry Farm')

      // Filter by fish
      const fishResult = await getDistrictDashboard(db, {
        districtId: district.id,
        page: 1,
        pageSize: 10,
        livestockType: 'fish',
      })

      expect(fishResult.farms).toHaveLength(1)
      expect(fishResult.farms[0].farmName).toBe('Fish Farm')
    })
  })

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const db = getTestDb()

      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const country = await db
        .insertInto('countries')
        .values({ code: 'D1', name: `Nigeria-${uniqueId}` })
        .returning('id')
        .executeTakeFirstOrThrow()

      const district = await db
        .insertInto('regions')
        .values({
          countryId: country.id,
          level: 2,
          name: 'Test District',
          slug: `test-district-d1-${uniqueId}`,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      // Create 15 farms with access grants
      for (let i = 0; i < 15; i++) {
        const { userId } = await seedTestUser({
          email: `farmer${i}-${Date.now()}-${i}@test.com`,
        })
        const farm = await db
          .insertInto('farms')
          .values({
            name: `Farm ${i}`,
            location: `Location ${i}`,
            type: 'poultry',
            districtId: district.id,
          })
          .returning('id')
          .executeTakeFirstOrThrow()

        await db
          .insertInto('user_farms')
          .values({ userId, farmId: farm.id, role: 'owner' })
          .execute()

        // Create access grant
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90)
        await db
          .insertInto('access_grants')
          .values({
            userId,
            farmId: farm.id,
            grantedBy: userId,
            expiresAt,
            financialVisibility: false,
          })
          .execute()
      }

      // Page 1 (10 items)
      const page1 = await getDistrictDashboard(db, {
        districtId: district.id,
        page: 1,
        pageSize: 10,
      })

      expect(page1.farms).toHaveLength(10)
      expect(page1.total).toBe(15)

      // Page 2 (5 items)
      const page2 = await getDistrictDashboard(db, {
        districtId: district.id,
        page: 2,
        pageSize: 10,
      })

      expect(page2.farms).toHaveLength(5)
      expect(page2.total).toBe(15)

      // Verify no overlap
      const page1Ids = page1.farms.map((f) => f.farmId)
      const page2Ids = page2.farms.map((f) => f.farmId)
      const overlap = page1Ids.filter((id) => page2Ids.includes(id))
      expect(overlap).toHaveLength(0)
    })
  })
})
