import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { getBatchesByFarm } from '../repository'
import { paginatedQuerySchema } from './validation'
import type { PaginatedQuery, PaginatedResult } from './types'
import { AppError } from '~/lib/errors'

/**
 * Get batches for a user, optionally filtered by farm and other criteria
 *
 * @param userId - ID of the user requesting batches
 * @param farmId - Optional farm ID to filter by
 * @param filters - Optional filters for status, livestock type, and species
 * @returns Promise resolving to an array of batches with farm names
 * @throws {Error} If the user lacks access to the requested farm
 *
 * @example
 * ```typescript
 * const batches = await getBatches('user_1', 'farm_A', { status: 'active' })
 * ```
 */
export async function getBatches(
  userId: string,
  farmId?: string,
  filters?: {
    status?: 'active' | 'depleted' | 'sold'
    livestockType?: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
    species?: string
  },
) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { checkFarmAccess, getUserFarms } = await import('../../auth/utils')

  try {
    let targetFarmIds: Array<string> = []

    if (farmId) {
      const hasAccess = await checkFarmAccess(userId, farmId)
      if (!hasAccess) {
        throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
      }
      targetFarmIds = [farmId]
    } else {
      // getUserFarms returns string[] of farm IDs
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) {
        return []
      }
    }

    // Database operation (from repository layer)
    return await getBatchesByFarm(db, targetFarmIds, filters)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch batches',
      cause: error,
    })
  }
}

/**
 * Perform a paginated query for batches with support for searching, sorting, and filtering
 *
 * @param userId - ID of the user performing the query
 * @param query - Pagination and filter parameters
 * @returns Promise resolving to a paginated result set
 *
 * @example
 * ```typescript
 * const result = await getBatchesPaginated('user_1', { page: 1, pageSize: 20, status: 'active' })
 * ```
 */
export async function getBatchesPaginated(
  userId: string,
  query: PaginatedQuery = {},
): Promise<
  PaginatedResult<{
    id: string
    farmId: string
    farmName: string | null
    livestockType: string
    species: string
    breedId?: string | null
    breedName?: string | null
    initialQuantity: number
    currentQuantity: number
    acquisitionDate: Date
    costPerUnit: string
    totalCost: string
    status: string
  }>
> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()
  const { sql } = await import('kysely')
  const { checkFarmAccess, getUserFarms } = await import('../../auth/utils')

  try {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const sortBy = query.sortBy || 'acquisitionDate'
    const sortOrder = query.sortOrder || 'desc'
    const search = query.search || ''

    // Determine target farms
    let targetFarmIds: Array<string> = []
    if (query.farmId) {
      const hasAccess = await checkFarmAccess(userId, query.farmId)
      if (!hasAccess)
        throw new AppError('ACCESS_DENIED', {
          metadata: { farmId: query.farmId },
        })
      targetFarmIds = [query.farmId]
    } else {
      targetFarmIds = await getUserFarms(userId)
      if (targetFarmIds.length === 0) {
        return { data: [], total: 0, page, pageSize, totalPages: 0 }
      }
    }

    // Build base query for count
    let countQuery = db
      .selectFrom('batches')
      .leftJoin('farms', 'farms.id', 'batches.farmId')
      .where('batches.farmId', 'in', targetFarmIds)

    // Apply search filter
    if (search) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('batches.species', 'ilike', `%${search}%`),
          eb('farms.name', 'ilike', `%${search}%`),
        ]),
      )
    }

    // Apply status filter
    if (query.status) {
      countQuery = countQuery.where(
        'batches.status',
        '=',
        query.status as 'active' | 'depleted' | 'sold',
      )
    }

    // Apply breed filter
    if (query.breedId) {
      countQuery = countQuery.where('batches.breedId', '=', query.breedId)
    }

    // Get total count
    const countResult = await countQuery
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst()
    const total = Number(countResult?.count || 0)
    const totalPages = Math.ceil(total / pageSize)

    // Apply sorting - use type-safe column reference
    type SortableColumn =
      | 'batches.species'
      | 'batches.currentQuantity'
      | 'batches.status'
      | 'batches.livestockType'
      | 'batches.acquisitionDate'

    const sortColumn: SortableColumn =
      sortBy === 'species'
        ? 'batches.species'
        : sortBy === 'currentQuantity'
          ? 'batches.currentQuantity'
          : sortBy === 'status'
            ? 'batches.status'
            : sortBy === 'livestockType'
              ? 'batches.livestockType'
              : 'batches.acquisitionDate'

    // Build data query
    let dataQuery = db
      .selectFrom('batches')
      .leftJoin('farms', 'farms.id', 'batches.farmId')
      .leftJoin('breeds', 'breeds.id', 'batches.breedId')
      .select([
        'batches.id',
        'batches.farmId',
        'batches.livestockType',
        'batches.species',
        'batches.breedId',
        'breeds.displayName as breedName',
        'batches.initialQuantity',
        'batches.currentQuantity',
        'batches.acquisitionDate',
        'batches.costPerUnit',
        'batches.totalCost',
        'batches.status',
        'farms.name as farmName',
      ])
      .where('batches.farmId', 'in', targetFarmIds)

    // Re-apply filters
    if (search) {
      dataQuery = dataQuery.where((eb) =>
        eb.or([
          eb('batches.species', 'ilike', `%${search}%`),
          eb('farms.name', 'ilike', `%${search}%`),
        ]),
      )
    }
    if (query.status) {
      dataQuery = dataQuery.where(
        'batches.status',
        '=',
        query.status as 'active' | 'depleted' | 'sold',
      )
    }
    if (query.breedId) {
      dataQuery = dataQuery.where('batches.breedId', '=', query.breedId)
    }

    // Apply sorting and pagination
    const data = await dataQuery
      .orderBy(sortColumn, sortOrder)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()

    return {
      data: data.map((d) => ({
        ...d,
        farmName: d.farmName || null,
      })),
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated batches',
      cause: error,
    })
  }
}

// Server function for paginated batches
export const getBatchesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator(paginatedQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    return getBatchesPaginated(session.user.id, data)
  })

// Server function for getting batches
export const getBatchesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../../auth/server-middleware')
    const session = await requireAuth()
    return getBatches(session.user.id, data.farmId)
  })

/**
 * Server function for getting batches with pagination and summary
 * Used by batches index route
 */
export const getBatchesForFarmFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      farmId: z.string().uuid().optional(),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      livestockType: z.string().optional(),
      breedId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../../auth/server-middleware')
      const session = await requireAuth()
      const farmId = data.farmId || undefined

      const { getInventorySummary } = await import('./stats')

      const [paginatedBatches, summary] = await Promise.all([
        getBatchesPaginated(session.user.id, {
          farmId,
          page: data.page,
          pageSize: data.pageSize,
          sortBy: data.sortBy,
          sortOrder: data.sortOrder,
          search: data.search,
          status: data.status,
          livestockType: data.livestockType,
          breedId: data.breedId,
        }),
        getInventorySummary(session.user.id, farmId),
      ])

      return { paginatedBatches, summary }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw redirect({ to: '/login' })
      }
      throw err
    }
  })
