/**
 * Server functions for feed inventory management.
 * Handles authentication, authorization, and orchestration.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  FEED_TYPES,
  quantityToDbString,
  validateFeedData,
  validateFeedUpdateData,
} from './service'
import {
  deleteFeedInventory,
  getFeedInventoryByFarmAndType,
  getFeedInventoryById,
  getLowStockFeed,
  insertFeedInventory,
  selectFeedInventory,
  updateFeedInventory,
} from './repository'
import type {
  CreateFeedInventoryInput,
  UpdateFeedInventoryInput,
} from './service'
import { checkFarmAccess, getUserFarms, verifyFarmAccess } from '~/features/auth/utils'
import { AppError } from '~/lib/errors'

export { FEED_TYPES }
export type { CreateFeedInventoryInput, UpdateFeedInventoryInput }

// ============================================================================
// Query Validators
// ============================================================================

const FeedQuerySchema = z.object({
  farmId: z.string().uuid().optional(),
})

const FeedCreateSchema = z.object({
  input: z.object({
    farmId: z.string().uuid(),
    feedType: z.string(),
    quantityKg: z.number().min(0),
    minThresholdKg: z.number().min(0),
  }),
})

const FeedUpdateSchema = z.object({
  id: z.string().uuid(),
  input: z.object({
    feedType: z.string().optional(),
    quantityKg: z.number().min(0).optional(),
    minThresholdKg: z.number().min(0).optional(),
  }),
})

const FeedDeleteSchema = z.object({
  id: z.string().uuid(),
})

const AddFeedStockSchema = z.object({
  farmId: z.string().uuid(),
  feedType: z.string(),
  quantityKg: z.number().positive(),
})

const ReduceFeedStockSchema = z.object({
  farmId: z.string().uuid(),
  feedType: z.string(),
  quantityKg: z.number().positive(),
})

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get feed inventory for a user - optionally filtered by farm
 */
export async function getFeedInventory(userId: string, farmId?: string) {
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

  const { db } = await import('~/lib/db')
  return selectFeedInventory(db, targetFarmIds)
}

export const getFeedInventoryFn = createServerFn({ method: 'GET' })
  .validator(FeedQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getFeedInventory(session.user.id, data.farmId)
  })

/**
 * Get low stock feed items
 */
export async function getLowStockFeedInventory(userId: string, farmId?: string) {
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

  const { db } = await import('~/lib/db')
  return getLowStockFeed(db, targetFarmIds)
}

export const getLowStockFeedFn = createServerFn({ method: 'GET' })
  .validator(FeedQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getLowStockFeedInventory(session.user.id, data.farmId)
  })

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new feed inventory record
 */
export async function createFeedInventory(
  userId: string,
  input: CreateFeedInventoryInput,
): Promise<string> {
  // Validate input
  const validationError = validateFeedData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  // Verify farm access
  await verifyFarmAccess(userId, input.farmId)

  const { db } = await import('~/lib/db')

  // Check if record already exists for this farm + feedType
  const existing = await getFeedInventoryByFarmAndType(db, input.farmId, input.feedType)
  if (existing) {
    throw new AppError('VALIDATION_ERROR', {
      message: `Feed inventory for ${input.feedType} already exists`,
      metadata: { field: 'feedType' },
    })
  }

  // Insert the record
  const id = await insertFeedInventory(db, {
    farmId: input.farmId,
    feedType: input.feedType,
    quantityKg: quantityToDbString(input.quantityKg),
    minThresholdKg: quantityToDbString(input.minThresholdKg),
  })

  return id
}

export const createFeedInventoryFn = createServerFn({ method: 'POST' })
  .validator(FeedCreateSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createFeedInventory(session.user.id, data.input)
  })

/**
 * Update a feed inventory record
 */
export async function updateFeedInventoryRecord(
  userId: string,
  id: string,
  input: UpdateFeedInventoryInput,
) {
  // Validate input
  const validationError = validateFeedUpdateData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  const { db } = await import('~/lib/db')
  const farmIds = await getUserFarms(userId)

  const record = await getFeedInventoryById(db, id)
  if (!record) {
    throw new AppError('FEED_INVENTORY_NOT_FOUND', {
      metadata: { resource: 'FeedInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  const updateData: {
    feedType?: string
    quantityKg?: string
    minThresholdKg?: string
  } = {}

  if (input.feedType !== undefined) updateData.feedType = input.feedType
  if (input.quantityKg !== undefined) updateData.quantityKg = quantityToDbString(input.quantityKg)
  if (input.minThresholdKg !== undefined) updateData.minThresholdKg = quantityToDbString(input.minThresholdKg)

  await updateFeedInventory(db, id, updateData)

  return true
}

export const updateFeedInventoryFn = createServerFn({ method: 'POST' })
  .validator(FeedUpdateSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateFeedInventoryRecord(session.user.id, data.id, data.input)
  })

/**
 * Delete a feed inventory record
 */
export async function deleteFeedInventoryRecord(userId: string, id: string) {
  const { db } = await import('~/lib/db')
  const farmIds = await getUserFarms(userId)

  const record = await getFeedInventoryById(db, id)
  if (!record) {
    throw new AppError('FEED_INVENTORY_NOT_FOUND', {
      metadata: { resource: 'FeedInventory', id },
    })
  }

  if (!farmIds.includes(record.farmId)) {
    throw new AppError('ACCESS_DENIED', {
      metadata: { farmId: record.farmId },
    })
  }

  await deleteFeedInventory(db, id)

  return true
}

export const deleteFeedInventoryFn = createServerFn({ method: 'POST' })
  .validator(FeedDeleteSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteFeedInventoryRecord(session.user.id, data.id)
  })

/**
 * Add stock to feed inventory (used when recording feed expenses)
 */
export async function addFeedStock(
  userId: string,
  farmId: string,
  feedType: string,
  quantityKg: number,
) {
  await verifyFarmAccess(userId, farmId)

  if (quantityKg <= 0) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Quantity must be positive',
      metadata: { field: 'quantityKg' },
    })
  }

  const { db } = await import('~/lib/db')

  const existing = await getFeedInventoryByFarmAndType(db, farmId, feedType as any)

  if (existing) {
    const currentQty = parseFloat(existing.quantityKg) || 0
    const newQuantity = currentQty + quantityKg
    await updateFeedInventory(db, existing.id, {
      quantityKg: newQuantity.toFixed(2),
    })
  } else {
    await insertFeedInventory(db, {
      farmId,
      feedType: feedType as any,
      quantityKg: quantityKg.toFixed(2),
      minThresholdKg: '10.00',
    })
  }

  return true
}

export const addFeedStockFn = createServerFn({ method: 'POST' })
  .validator(AddFeedStockSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return addFeedStock(session.user.id, data.farmId, data.feedType, data.quantityKg)
  })

/**
 * Reduce feed stock (used when recording feed given to batches)
 */
export async function reduceFeedStock(
  userId: string,
  farmId: string,
  feedType: string,
  quantityKg: number,
) {
  await verifyFarmAccess(userId, farmId)

  if (quantityKg <= 0) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Quantity must be positive',
      metadata: { field: 'quantityKg' },
    })
  }

  const { db } = await import('~/lib/db')

  const existing = await getFeedInventoryByFarmAndType(db, farmId, feedType as any)

  if (!existing) {
    throw new AppError('FEED_INVENTORY_NOT_FOUND', {
      message: `No ${feedType} inventory found for this farm`,
      metadata: { resource: 'FeedInventory', feedType },
    })
  }

  const currentQty = parseFloat(existing.quantityKg) || 0
  if (currentQty < quantityKg) {
    throw new AppError('INSUFFICIENT_STOCK', {
      message: `Insufficient ${feedType} stock`,
      metadata: { available: currentQty, requested: quantityKg },
    })
  }

  const newQuantity = currentQty - quantityKg
  await updateFeedInventory(db, existing.id, {
    quantityKg: newQuantity.toFixed(2),
  })

  return true
}

export const reduceFeedStockFn = createServerFn({ method: 'POST' })
  .validator(ReduceFeedStockSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return reduceFeedStock(session.user.id, data.farmId, data.feedType, data.quantityKg)
  })
