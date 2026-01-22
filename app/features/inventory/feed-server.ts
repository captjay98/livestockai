/**
 * Server functions for feed inventory management.
 * Handles authentication, authorization, and orchestration.
 */

import { createServerFn } from '@tanstack/react-start'
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
import type { FeedInventoryUpdate } from './repository'
import {
  checkFarmAccess,
  getUserFarms,
  verifyFarmAccess,
} from '~/features/auth/utils'
import { AppError } from '~/lib/errors'

export { FEED_TYPES }
export type { CreateFeedInventoryInput, UpdateFeedInventoryInput }

type FeedQueryInput = { farmId?: string }
type FeedCreateInput = {
  input: {
    farmId: string
    feedType: string
    quantityKg: number
    minThresholdKg: number
  }
}
type FeedUpdateInput = {
  id: string
  input: {
    feedType?: string
    quantityKg?: number
    minThresholdKg?: number
  }
}
type FeedDeleteInput = { id: string }
type FeedStockInput = { farmId: string; feedType: string; quantityKg: number }

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
  .inputValidator((data: FeedQueryInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getFeedInventory(session.user.id, data.farmId)
  })

export async function getLowStockFeedInventory(
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

  const { db } = await import('~/lib/db')
  return getLowStockFeed(db, targetFarmIds)
}

export const getLowStockFeedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: FeedQueryInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getLowStockFeedInventory(session.user.id, data.farmId)
  })

export async function createFeedInventory(
  userId: string,
  input: CreateFeedInventoryInput,
): Promise<string> {
  const validationError = validateFeedData(input)
  if (validationError) {
    throw new AppError('VALIDATION_ERROR', {
      message: validationError,
      metadata: { field: 'input' },
    })
  }

  await verifyFarmAccess(userId, input.farmId)

  const { db } = await import('~/lib/db')

  const existing = await getFeedInventoryByFarmAndType(
    db,
    input.farmId,
    input.feedType,
  )
  if (existing) {
    throw new AppError('VALIDATION_ERROR', {
      message: `Feed inventory for ${input.feedType} already exists`,
      metadata: { field: 'feedType' },
    })
  }

  const id = await insertFeedInventory(db, {
    farmId: input.farmId,
    feedType: input.feedType,
    quantityKg: quantityToDbString(input.quantityKg),
    minThresholdKg: quantityToDbString(input.minThresholdKg),
  })

  return id
}

export const createFeedInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FeedCreateInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createFeedInventory(
      session.user.id,
      data.input as CreateFeedInventoryInput,
    )
  })

export async function updateFeedInventoryRecord(
  userId: string,
  id: string,
  input: UpdateFeedInventoryInput,
) {
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

  const updateData: FeedInventoryUpdate = {}

  if (input.feedType !== undefined)
    updateData.feedType = input.feedType as FeedInventoryUpdate['feedType']
  if (input.quantityKg !== undefined)
    updateData.quantityKg = quantityToDbString(input.quantityKg)
  if (input.minThresholdKg !== undefined)
    updateData.minThresholdKg = quantityToDbString(input.minThresholdKg)

  await updateFeedInventory(db, id, updateData)

  return true
}

export const updateFeedInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FeedUpdateInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateFeedInventoryRecord(
      session.user.id,
      data.id,
      data.input as UpdateFeedInventoryInput,
    )
  })

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
  .inputValidator((data: FeedDeleteInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteFeedInventoryRecord(session.user.id, data.id)
  })

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

  const existing = await getFeedInventoryByFarmAndType(
    db,
    farmId,
    feedType as NonNullable<FeedInventoryUpdate['feedType']>,
  )

  if (existing) {
    const currentQty = parseFloat(existing.quantityKg) || 0
    const newQuantity = currentQty + quantityKg
    await updateFeedInventory(db, existing.id, {
      quantityKg: newQuantity.toFixed(2),
    })
  } else {
    await insertFeedInventory(db, {
      farmId,
      feedType: feedType as CreateFeedInventoryInput['feedType'],
      quantityKg: quantityKg.toFixed(2),
      minThresholdKg: '10.00',
    })
  }

  return true
}

export const addFeedStockFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FeedStockInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return addFeedStock(
      session.user.id,
      data.farmId,
      data.feedType,
      data.quantityKg,
    )
  })

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

  const existing = await getFeedInventoryByFarmAndType(
    db,
    farmId,
    feedType as NonNullable<FeedInventoryUpdate['feedType']>,
  )

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
  .inputValidator((data: FeedStockInput) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return reduceFeedStock(
      session.user.id,
      data.farmId,
      data.feedType,
      data.quantityKg,
    )
  })
