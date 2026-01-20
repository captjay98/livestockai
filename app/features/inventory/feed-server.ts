import { createServerFn } from '@tanstack/react-start'

export type FeedType =
  | 'starter'
  | 'grower'
  | 'finisher'
  | 'layer_mash'
  | 'fish_feed'

export const FEED_TYPES: Array<{ value: FeedType; label: string }> = [
  { value: 'starter', label: 'Starter' },
  { value: 'grower', label: 'Grower' },
  { value: 'finisher', label: 'Finisher' },
  { value: 'layer_mash', label: 'Layer Mash' },
  { value: 'fish_feed', label: 'Fish Feed' },
]

export interface CreateFeedInventoryInput {
  farmId: string
  feedType: FeedType
  quantityKg: number
  minThresholdKg: number
}

export interface UpdateFeedInventoryInput {
  feedType?: FeedType
  quantityKg?: number
  minThresholdKg?: number
}

/**
 * Get feed inventory for a user - optionally filtered by farm
 */
export async function getFeedInventory(userId: string, farmId?: string) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
      targetFarmIds = [farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) return []
    }

    return await db
      .selectFrom('feed_inventory')
      .leftJoin('farms', 'farms.id', 'feed_inventory.farmId')
      .select([
        'feed_inventory.id',
        'feed_inventory.farmId',
        'feed_inventory.feedType',
        'feed_inventory.quantityKg',
        'feed_inventory.minThresholdKg',
        'feed_inventory.updatedAt',
        'farms.name as farmName',
      ])
      .where('feed_inventory.farmId', 'in', targetFarmIds)
      .orderBy('feed_inventory.feedType', 'asc')
      .execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch feed inventory',
      cause: error,
    })
  }
}

export const getFeedInventoryFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getFeedInventory(session.user.id, data.farmId)
  })

/**
 * Create a new feed inventory record
 */
export async function createFeedInventory(
  userId: string,
  input: CreateFeedInventoryInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, input.farmId)

    // Check if record already exists for this farm + feedType
    const existing = await db
      .selectFrom('feed_inventory')
      .select('id')
      .where('farmId', '=', input.farmId)
      .where('feedType', '=', input.feedType)
      .executeTakeFirst()

    if (existing) {
      throw new AppError('VALIDATION_ERROR', {
        message: `Feed inventory for ${input.feedType} already exists`,
        metadata: { field: 'feedType' },
      })
    }

    const result = await db
      .insertInto('feed_inventory')
      .values({
        farmId: input.farmId,
        feedType: input.feedType,
        quantityKg: input.quantityKg.toString(),
        minThresholdKg: input.minThresholdKg.toString(),
        updatedAt: new Date(),
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    return result.id
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create feed inventory record',
      cause: error,
    })
  }
}

export const createFeedInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { input: CreateFeedInventoryInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createFeedInventory(session.user.id, data.input)
  })

/**
 * Update a feed inventory record
 */
export async function updateFeedInventory(
  userId: string,
  id: string,
  input: UpdateFeedInventoryInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const farmIds = await getUserFarms(userId)

    const record = await db
      .selectFrom('feed_inventory')
      .select(['id', 'farmId'])
      .where('id', '=', id)
      .executeTakeFirst()

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

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (input.feedType !== undefined) updateData.feedType = input.feedType
    if (input.quantityKg !== undefined)
      updateData.quantityKg = input.quantityKg.toString()
    if (input.minThresholdKg !== undefined)
      updateData.minThresholdKg = input.minThresholdKg.toString()

    await db
      .updateTable('feed_inventory')
      .set(updateData)
      .where('id', '=', id)
      .execute()

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update feed inventory',
      cause: error,
    })
  }
}

export const updateFeedInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; input: UpdateFeedInventoryInput }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateFeedInventory(session.user.id, data.id, data.input)
  })

/**
 * Delete a feed inventory record
 */
export async function deleteFeedInventory(userId: string, id: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const farmIds = await getUserFarms(userId)

    const record = await db
      .selectFrom('feed_inventory')
      .select(['id', 'farmId'])
      .where('id', '=', id)
      .executeTakeFirst()

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

    await db.deleteFrom('feed_inventory').where('id', '=', id).execute()
    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete feed inventory',
      cause: error,
    })
  }
}

export const deleteFeedInventoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteFeedInventory(session.user.id, data.id)
  })

/**
 * Add stock to feed inventory (used when recording feed expenses)
 */
export async function addFeedStock(
  userId: string,
  farmId: string,
  feedType: FeedType,
  quantityKg: number,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    const existing = await db
      .selectFrom('feed_inventory')
      .select(['id', 'quantityKg'])
      .where('farmId', '=', farmId)
      .where('feedType', '=', feedType)
      .executeTakeFirst()

    if (existing) {
      const newQuantity = parseFloat(existing.quantityKg) + quantityKg
      await db
        .updateTable('feed_inventory')
        .set({
          quantityKg: newQuantity.toString(),
          updatedAt: new Date(),
        })
        .where('id', '=', existing.id)
        .execute()
    } else {
      await db
        .insertInto('feed_inventory')
        .values({
          farmId,
          feedType,
          quantityKg: quantityKg.toString(),
          minThresholdKg: '10.00',
          updatedAt: new Date(),
        })
        .execute()
    }

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to add feed stock',
      cause: error,
    })
  }
}

/**
 * Reduce feed stock (used when recording feed given to batches)
 */
export async function reduceFeedStock(
  userId: string,
  farmId: string,
  feedType: FeedType,
  quantityKg: number,
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    const existing = await db
      .selectFrom('feed_inventory')
      .select(['id', 'quantityKg'])
      .where('farmId', '=', farmId)
      .where('feedType', '=', feedType)
      .executeTakeFirst()

    if (!existing) {
      throw new AppError('FEED_INVENTORY_NOT_FOUND', {
        message: `No ${feedType} inventory found for this farm`,
        metadata: { resource: 'FeedInventory', feedType },
      })
    }

    const currentQty = parseFloat(existing.quantityKg)
    if (currentQty < quantityKg) {
      throw new AppError('INSUFFICIENT_STOCK', {
        message: `Insufficient ${feedType} stock`,
        metadata: { available: currentQty, requested: quantityKg },
      })
    }

    const newQuantity = currentQty - quantityKg
    await db
      .updateTable('feed_inventory')
      .set({
        quantityKg: newQuantity.toString(),
        updatedAt: new Date(),
      })
      .where('id', '=', existing.id)
      .execute()

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to reduce feed stock',
      cause: error,
    })
  }
}
