import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  resetTestDb,
  seedTestFarm,
  seedTestUser,
  truncateAllTables,
} from '../../helpers/db-integration'
import type { SupplyInsert } from '~/features/inventory/supplies-repository'
import {
  addStock,
  createSupply,
  deleteSupply,
  getExpiringSupplies,
  getLowStockSupplies,
  getSuppliesByFarm,
  getSupplyById,
  reduceStock,
  updateSupply,
} from '~/features/inventory/supplies-repository'

describe('Supplies Repository - Integration Tests', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  describe('Property 1: Supply Creation Stores All Fields', () => {
    it('should store all required fields correctly', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyData: SupplyInsert = {
        farmId,
        itemName: 'Test Disinfectant',
        category: 'disinfectant',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
      }

      const supplyId = await createSupply(db, supplyData)
      expect(supplyId).toBeTruthy()

      const retrieved = await getSupplyById(db, supplyId)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(supplyId)
      expect(retrieved!.farmId).toBe(farmId)
      expect(retrieved!.itemName).toBe('Test Disinfectant')
      expect(retrieved!.category).toBe('disinfectant')
      expect(retrieved!.quantityKg).toBe('50.00')
      expect(retrieved!.unit).toBe('liters')
      expect(retrieved!.minThresholdKg).toBe('10.00')
      expect(retrieved!.createdAt).toBeInstanceOf(Date)
      expect(retrieved!.updatedAt).toBeInstanceOf(Date)
    })

    it('should store all optional fields correctly', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const expiryDate = new Date('2025-12-31')
      const lastRestocked = new Date('2025-01-01')

      const supplyData: SupplyInsert = {
        farmId,
        itemName: 'Premium Bedding',
        category: 'bedding',
        quantityKg: '100.00',
        unit: 'bags',
        minThresholdKg: '20.00',
        costPerUnit: '15.50',
        supplierId: null,
        lastRestocked,
        expiryDate,
        notes: 'High quality wood shavings',
      }

      const supplyId = await createSupply(db, supplyData)
      const retrieved = await getSupplyById(db, supplyId)

      expect(retrieved).toBeDefined()
      expect(retrieved!.costPerUnit).toBe('15.50')
      expect(retrieved!.lastRestocked).toEqual(lastRestocked)
      expect(retrieved!.expiryDate).toEqual(expiryDate)
      expect(retrieved!.notes).toBe('High quality wood shavings')
    })
  })

  describe('Property 10: Delete Operation Removes Item', () => {
    it('should delete supply and make it unretrievable', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyData: SupplyInsert = {
        farmId,
        itemName: 'Temporary Item',
        category: 'chemical',
        quantityKg: '25.00',
        unit: 'kg',
        minThresholdKg: '5.00',
      }

      const supplyId = await createSupply(db, supplyData)
      expect(await getSupplyById(db, supplyId)).toBeDefined()

      await deleteSupply(db, supplyId)
      expect(await getSupplyById(db, supplyId)).toBeUndefined()
    })

    it('should remove deleted supply from farm queries', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supply1Id = await createSupply(db, {
        farmId,
        itemName: 'Supply 1',
        category: 'fuel',
        quantityKg: '100.00',
        unit: 'liters',
        minThresholdKg: '20.00',
      })

      const supply2Id = await createSupply(db, {
        farmId,
        itemName: 'Supply 2',
        category: 'fuel',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
      })

      let supplies = await getSuppliesByFarm(db, farmId)
      expect(supplies).toHaveLength(2)

      await deleteSupply(db, supply1Id)

      supplies = await getSuppliesByFarm(db, farmId)
      expect(supplies).toHaveLength(1)
      expect(supplies[0].id).toBe(supply2Id)
    })
  })

  describe('Property 3: Stock Transactions Preserve Arithmetic', () => {
    it('should increase quantity when adding stock', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'packaging',
        quantityKg: '50.00',
        unit: 'pieces',
        minThresholdKg: '10.00',
      })

      await addStock(db, supplyId, 25)

      const updated = await getSupplyById(db, supplyId)
      expect(parseFloat(updated!.quantityKg)).toBeCloseTo(75, 2)
    })

    it('should decrease quantity when reducing stock', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'packaging',
        quantityKg: '50.00',
        unit: 'pieces',
        minThresholdKg: '10.00',
      })

      await reduceStock(db, supplyId, 15)

      const updated = await getSupplyById(db, supplyId)
      expect(parseFloat(updated!.quantityKg)).toBeCloseTo(35, 2)
    })

    it('should preserve arithmetic: Q + A - B = Q + (A - B)', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const initialQty = 100
      const addAmount = 50
      const reduceAmount = 30

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'disinfectant',
        quantityKg: initialQty.toFixed(2),
        unit: 'liters',
        minThresholdKg: '10.00',
      })

      await addStock(db, supplyId, addAmount)
      await reduceStock(db, supplyId, reduceAmount)

      const final = await getSupplyById(db, supplyId)
      const expectedQty = initialQty + addAmount - reduceAmount
      expect(parseFloat(final!.quantityKg)).toBeCloseTo(expectedQty, 2)
    })
  })

  describe('Property 4: Stock Reduction Prevents Negative Quantities', () => {
    it('should allow reducing stock when sufficient quantity available', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'bedding',
        quantityKg: '50.00',
        unit: 'bags',
        minThresholdKg: '10.00',
      })

      await expect(reduceStock(db, supplyId, 30)).resolves.not.toThrow()

      const updated = await getSupplyById(db, supplyId)
      expect(parseFloat(updated!.quantityKg)).toBeCloseTo(20, 2)
    })

    it('should handle reducing to exactly zero', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'chemical',
        quantityKg: '50.00',
        unit: 'kg',
        minThresholdKg: '10.00',
      })

      await reduceStock(db, supplyId, 50)

      const updated = await getSupplyById(db, supplyId)
      expect(parseFloat(updated!.quantityKg)).toBeCloseTo(0, 2)
    })
  })

  describe('Property 12: Stock Transaction Atomicity', () => {
    it('should update both quantity and lastRestocked atomically when adding stock', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'fuel',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
        lastRestocked: null,
      })

      const beforeAdd = await getSupplyById(db, supplyId)
      expect(beforeAdd!.lastRestocked).toBeNull()

      const beforeTime = new Date()
      await addStock(db, supplyId, 25)
      const afterTime = new Date()

      const afterAdd = await getSupplyById(db, supplyId)
      expect(parseFloat(afterAdd!.quantityKg)).toBeCloseTo(75, 2)
      expect(afterAdd!.lastRestocked).not.toBeNull()
      expect(afterAdd!.lastRestocked!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      )
      expect(afterAdd!.lastRestocked!.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      )
    })

    it('should update quantity without changing lastRestocked when reducing stock', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const lastRestocked = new Date('2025-01-01')

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Test Supply',
        category: 'pest_control',
        quantityKg: '50.00',
        unit: 'kg',
        minThresholdKg: '10.00',
        lastRestocked,
      })

      await reduceStock(db, supplyId, 15)

      const updated = await getSupplyById(db, supplyId)
      expect(parseFloat(updated!.quantityKg)).toBeCloseTo(35, 2)
      expect(updated!.lastRestocked).toEqual(lastRestocked)
    })
  })

  describe('Property 9: CreatedAt Timestamp Immutability', () => {
    it('should preserve createdAt when updating supply', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const supplyId = await createSupply(db, {
        farmId,
        itemName: 'Original Name',
        category: 'disinfectant',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
      })

      const original = await getSupplyById(db, supplyId)
      const originalCreatedAt = original!.createdAt

      // Wait a bit to ensure timestamps would differ
      await new Promise((resolve) => setTimeout(resolve, 10))

      await updateSupply(db, supplyId, {
        itemName: 'Updated Name',
        quantityKg: '75.00',
      })

      const updated = await getSupplyById(db, supplyId)
      expect(updated!.createdAt).toEqual(originalCreatedAt)
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        original!.updatedAt.getTime(),
      )
    })
  })

  describe('Database Constraints', () => {
    it('should enforce non-negative quantity constraint', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      await expect(
        createSupply(db, {
          farmId,
          itemName: 'Invalid Supply',
          category: 'bedding',
          quantityKg: '-10.00',
          unit: 'bags',
          minThresholdKg: '5.00',
        }),
      ).rejects.toThrow()
    })

    it('should enforce non-negative threshold constraint', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      await expect(
        createSupply(db, {
          farmId,
          itemName: 'Invalid Supply',
          category: 'chemical',
          quantityKg: '50.00',
          unit: 'kg',
          minThresholdKg: '-5.00',
        }),
      ).rejects.toThrow()
    })

    it('should enforce non-negative cost constraint', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      await expect(
        createSupply(db, {
          farmId,
          itemName: 'Invalid Supply',
          category: 'fuel',
          quantityKg: '50.00',
          unit: 'liters',
          minThresholdKg: '10.00',
          costPerUnit: '-5.00',
        }),
      ).rejects.toThrow()
    })

    it('should enforce foreign key constraint on farmId', async () => {
      const db = getTestDb()

      await expect(
        createSupply(db, {
          farmId: 'non-existent-farm-id',
          itemName: 'Invalid Supply',
          category: 'packaging',
          quantityKg: '50.00',
          unit: 'pieces',
          minThresholdKg: '10.00',
        }),
      ).rejects.toThrow()
    })
  })

  describe('Query Operations', () => {
    it('should retrieve supplies by farm', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId: farm1 } = await seedTestFarm(userId)
      const { farmId: farm2 } = await seedTestFarm(userId)
      const db = getTestDb()

      await createSupply(db, {
        farmId: farm1,
        itemName: 'Farm 1 Supply',
        category: 'disinfectant',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
      })

      await createSupply(db, {
        farmId: farm2,
        itemName: 'Farm 2 Supply',
        category: 'bedding',
        quantityKg: '100.00',
        unit: 'bags',
        minThresholdKg: '20.00',
      })

      const farm1Supplies = await getSuppliesByFarm(db, farm1)
      const farm2Supplies = await getSuppliesByFarm(db, farm2)

      expect(farm1Supplies).toHaveLength(1)
      expect(farm2Supplies).toHaveLength(1)
      expect(farm1Supplies[0].itemName).toBe('Farm 1 Supply')
      expect(farm2Supplies[0].itemName).toBe('Farm 2 Supply')
    })

    it('should filter supplies by category', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      await createSupply(db, {
        farmId,
        itemName: 'Disinfectant',
        category: 'disinfectant',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
      })

      await createSupply(db, {
        farmId,
        itemName: 'Bedding',
        category: 'bedding',
        quantityKg: '100.00',
        unit: 'bags',
        minThresholdKg: '20.00',
      })

      const disinfectants = await getSuppliesByFarm(db, farmId, 'disinfectant')
      expect(disinfectants).toHaveLength(1)
      expect(disinfectants[0].category).toBe('disinfectant')
    })

    it('should retrieve low stock supplies', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      await createSupply(db, {
        farmId,
        itemName: 'Low Stock Item',
        category: 'chemical',
        quantityKg: '5.00',
        unit: 'kg',
        minThresholdKg: '10.00',
      })

      await createSupply(db, {
        farmId,
        itemName: 'Normal Stock Item',
        category: 'fuel',
        quantityKg: '50.00',
        unit: 'liters',
        minThresholdKg: '10.00',
      })

      const lowStock = await getLowStockSupplies(db, farmId)
      expect(lowStock).toHaveLength(1)
      expect(lowStock[0].itemName).toBe('Low Stock Item')
    })

    it('should retrieve expiring supplies', async () => {
      const { userId } = await seedTestUser({
        email: `test-${Date.now()}@example.com`,
      })
      const { farmId } = await seedTestFarm(userId)
      const db = getTestDb()

      const soonExpiry = new Date()
      soonExpiry.setDate(soonExpiry.getDate() + 15)

      const farExpiry = new Date()
      farExpiry.setDate(farExpiry.getDate() + 60)

      await createSupply(db, {
        farmId,
        itemName: 'Expiring Soon',
        category: 'pest_control',
        quantityKg: '25.00',
        unit: 'kg',
        minThresholdKg: '5.00',
        expiryDate: soonExpiry,
      })

      await createSupply(db, {
        farmId,
        itemName: 'Not Expiring Soon',
        category: 'packaging',
        quantityKg: '100.00',
        unit: 'pieces',
        minThresholdKg: '20.00',
        expiryDate: farExpiry,
      })

      const expiring = await getExpiringSupplies(db, farmId, 30)
      expect(expiring).toHaveLength(1)
      expect(expiring[0].itemName).toBe('Expiring Soon')
    })
  })
})
