/**
 * Server functions for supplies inventory management.
 * Handles authentication, authorization, and orchestration.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  SUPPLY_CATEGORIES,
  SUPPLY_UNITS,
  quantityToDbString,
  validateSupplyData,
  validateSupplyUpdateData,
} from './supplies-service'
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
} from './supplies-repository'
import type { CreateSupplyInput, UpdateSupplyInput } from './supplies-service'
import type { SupplyUpdate } from './supplies-repository'
import {
  checkFarmAccess,
  getUserFarms,
  verifyFarmAccess,
} from '~/features/auth/utils'
import { AppError } from '~/lib/errors'

export { SUPPLY_CATEGORIES, SUPPLY_UNITS }
export type { CreateSupplyInput, UpdateSupplyInput }

const suppliesQuerySchema = z.object({
  farmId: z.string().uuid().optional(),
  category: z
    .enum(SUPPLY_CATEGORIES as unknown as [string, ...Array<string>])
    .optional(),
})

const lowStockQuerySchema = z.object({
  farmId: z.string().uuid().optional(),
})

const expiringQuerySchema = z.object({
  farmId: z.string().uuid().optional(),
  daysAhead: z.number().int().positive().optional(),
})

const supplyCreateSchema = z.object({
  input: z.object({
    farmId: z.string().uuid(),
    itemName: z.string().min(1).max(200),
    category: z.enum(
      SUPPLY_CATEGORIES as unknown as [string, ...Array<string>],
    ),
    quantityKg: z.number().nonnegative(),
    unit: z.enum(SUPPLY_UNITS as unknown as [string, ...Array<string>]),
    minThresholdKg: z.number().nonnegative(),
    costPerUnit: z.number().nonnegative().optional(),
    supplierId: z.string().uuid().optional(),
    lastRestocked: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    notes: z.string().max(500).optional(),
  }),
})

const supplyUpdateSchema = z.object({
  id: z.string().uuid(),
  input: z.object({
    itemName: z.string().min(1).max(200).optional(),
    category: z
      .enum(SUPPLY_CATEGORIES as unknown as [string, ...Array<string>])
      .optional(),
    quantityKg: z.number().nonnegative().optional(),
    unit: z
      .enum(SUPPLY_UNITS as unknown as [string, ...Array<string>])
      .optional(),
    minThresholdKg: z.number().nonnegative().optional(),
    costPerUnit: z.number().nonnegative().optional(),
    supplierId: z.string().uuid().optional(),
    lastRestocked: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    notes: z.string().max(500).optional(),
  }),
})

const supplyDeleteSchema = z.object({
  id: z.string().uuid(),
})

const stockTransactionSchema = z.object({
  supplyId: z.string().uuid(),
  quantity: z.number().positive(),
})

export async function getSuppliesInventoryForUser(
  userId: string,
  farmId?: string,
  category?: string,
) {
  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  // Get supplies for all user's farms
  const allSupplies = await Promise.all(
    targetFarmIds.map((fId) => getSuppliesByFarm(db, fId, category as any)),
  )

  return allSupplies.flat()
}

export const getSuppliesInventoryFn = createServerFn({ method: 'GET' })
  .inputValidator(suppliesQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getSuppliesInventoryForUser(
      session.user.id,
      data.farmId,
      data.category,
    )
  })

export async function getLowStockSuppliesForUser(
  userId: string,
  farmId?: string,
) {
  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  const allSupplies = await Promise.all(
    targetFarmIds.map((fId) => getLowStockSupplies(db, fId)),
  )

  return allSupplies.flat()
}

export const getLowStockSuppliesFn = createServerFn({ method: 'GET' })
  .inputValidator(lowStockQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getLowStockSuppliesForUser(session.user.id, data.farmId)
  })

export async function getExpiringSuppliesForUser(
  userId: string,
  farmId?: string,
  daysAhead: number = 30,
) {
  let targetFarmIds: Array<string> = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }
    targetFarmIds = [farmId]
  } else {
    targetFarmIds = await getUserFarms(userId)
    if (targetFarmIds.length === 0) return []
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  const allSupplies = await Promise.all(
    targetFarmIds.map((fId) => getExpiringSupplies(db, fId, daysAhead)),
  )

  return allSupplies.flat()
}

export const getExpiringSuppliesFn = createServerFn({ method: 'GET' })
  .inputValidator(expiringQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getExpiringSuppliesForUser(
      session.user.id,
      data.farmId,
      data.daysAhead ?? 30,
    )
  })

export async function createSuppliesInventory(
  userId: string,
  input: CreateSupplyInput,
): Promise<string> {
  const validationError = validateSupplyData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  await verifyFarmAccess(userId, input.farmId)

  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  const id = await createSupply(db, {
    farmId: input.farmId,
    itemName: input.itemName,
    category: input.category,
    quantityKg: quantityToDbString(input.quantityKg),
    unit: input.unit,
    minThresholdKg: quantityToDbString(input.minThresholdKg),
    costPerUnit: input.costPerUnit
      ? quantityToDbString(input.costPerUnit)
      : null,
    supplierId: input.supplierId ?? null,
    lastRestocked: input.lastRestocked ?? null,
    expiryDate: input.expiryDate ?? null,
    notes: input.notes ?? null,
  })

  return id
}

export const createSuppliesInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(supplyCreateSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createSuppliesInventory(
      session.user.id,
      data.input as CreateSupplyInput,
    )
  })

export async function updateSuppliesInventory(
  userId: string,
  id: string,
  input: UpdateSupplyInput,
) {
  const validationError = validateSupplyUpdateData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const farmIds = await getUserFarms(userId)

  const record = await getSupplyById(db, id)
  if (!record) {
    throw new AppError('NOT_FOUND', {
      metadata: { resource: 'SuppliesInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  const updateData: SupplyUpdate = {}

  if (input.itemName !== undefined) updateData.itemName = input.itemName
  if (input.category !== undefined) updateData.category = input.category
  if (input.quantityKg !== undefined)
    updateData.quantityKg = quantityToDbString(input.quantityKg)
  if (input.unit !== undefined) updateData.unit = input.unit
  if (input.minThresholdKg !== undefined)
    updateData.minThresholdKg = quantityToDbString(input.minThresholdKg)
  if (input.costPerUnit !== undefined)
    updateData.costPerUnit = quantityToDbString(input.costPerUnit)
  if (input.supplierId !== undefined) updateData.supplierId = input.supplierId
  if (input.lastRestocked !== undefined)
    updateData.lastRestocked = input.lastRestocked
  if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate
  if (input.notes !== undefined) updateData.notes = input.notes

  await updateSupply(db, id, updateData)

  return true
}

export const updateSuppliesInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(supplyUpdateSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateSuppliesInventory(
      session.user.id,
      data.id,
      data.input as UpdateSupplyInput,
    )
  })

export async function deleteSuppliesInventory(userId: string, id: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const farmIds = await getUserFarms(userId)

  const record = await getSupplyById(db, id)
  if (!record) {
    throw new AppError('NOT_FOUND', {
      metadata: { resource: 'SuppliesInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  await deleteSupply(db, id)

  return true
}

export const deleteSuppliesInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(supplyDeleteSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteSuppliesInventory(session.user.id, data.id)
  })

export async function addSuppliesStock(
  userId: string,
  supplyId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Quantity must be positive',
      metadata: { field: 'quantity' },
    })
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const farmIds = await getUserFarms(userId)

  const record = await getSupplyById(db, supplyId)
  if (!record) {
    throw new AppError('NOT_FOUND', {
      metadata: { resource: 'SuppliesInventory', supplyId },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  await addStock(db, supplyId, quantity)

  return true
}

export const addSuppliesStockFn = createServerFn({ method: 'POST' })
  .inputValidator(stockTransactionSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return addSuppliesStock(session.user.id, data.supplyId, data.quantity)
  })

export async function reduceSuppliesStock(
  userId: string,
  supplyId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Quantity must be positive',
      metadata: { field: 'quantity' },
    })
  }

  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const farmIds = await getUserFarms(userId)

  const record = await getSupplyById(db, supplyId)
  if (!record) {
    throw new AppError('NOT_FOUND', {
      metadata: { resource: 'SuppliesInventory', supplyId },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  // Check sufficient stock
  const currentQty = parseFloat(record.quantityKg) || 0
  if (currentQty < quantity) {
    throw new AppError('INSUFFICIENT_STOCK', {
      message: `Insufficient ${record.itemName} stock`,
      metadata: { available: currentQty, requested: quantity },
    })
  }

  await reduceStock(db, supplyId, quantity)

  return true
}

export const reduceSuppliesStockFn = createServerFn({ method: 'POST' })
  .inputValidator(stockTransactionSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return reduceSuppliesStock(session.user.id, data.supplyId, data.quantity)
  })
