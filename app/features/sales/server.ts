import { createServerFn } from '@tanstack/react-start'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'

export type { PaginatedResult }

export type UnitType = 'bird' | 'kg' | 'crate' | 'piece'
export type PaymentStatus = 'paid' | 'pending' | 'partial'
export type PaymentMethod = 'cash' | 'transfer' | 'credit'

/**
 * Available units of measurement for sales transactions.
 */
export const UNIT_TYPES: Array<{ value: UnitType; label: string }> = [
  { value: 'bird', label: 'Bird' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'crate', label: 'Crate' },
  { value: 'piece', label: 'Piece' },
]

/**
 * Possible payment statuses for a sale.
 */
export const PAYMENT_STATUSES: Array<{
  value: PaymentStatus
  label: string
  color: string
}> = [
  { value: 'paid', label: 'Paid', color: 'text-green-600 bg-green-100' },
  {
    value: 'pending',
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-100',
  },
  {
    value: 'partial',
    label: 'Partial',
    color: 'text-orange-600 bg-orange-100',
  },
]

/**
 * Supported payment methods for livestock and egg sales.
 */
export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit' },
]

/**
 * Input data for creating a new sales record
 */
export interface CreateSaleInput {
  /** ID of the farm the sale belongs to */
  farmId: string
  /** Optional ID of the specific batch being sold from */
  batchId?: string | null
  /** Optional ID of the customer who made the purchase */
  customerId?: string | null
  /** The type of item sold (poultry, fish, or eggs) */
  livestockType: 'poultry' | 'fish' | 'eggs'
  /** Quantity of items sold */
  quantity: number
  /** Unit price for the item sold */
  unitPrice: number
  /** Date of the transaction */
  date: Date
  /** Optional transaction notes */
  notes?: string | null
  // Enhanced fields
  /** The unit of measurement for quantity (bird, kg, crate, piece) */
  unitType?: UnitType | null
  /** Optional age of the livestock in weeks at time of sale */
  ageWeeks?: number | null
  /** Optional average weight in kilograms at time of sale */
  averageWeightKg?: number | null
  /** Status of the payment (paid, pending, partial) */
  paymentStatus?: PaymentStatus | null
  /** Method of payment used (cash, transfer, credit) */
  paymentMethod?: PaymentMethod | null
}

/**
 * Create a new sales record, update batch quantity if applicable, and log audit
 *
 * @param userId - ID of the user creating the sale
 * @param input - Sales data input
 * @returns Promise resolving to the created sale ID
 * @throws {Error} If user lacks access to the farm or batch
 *
 * @example
 * ```typescript
 * const saleId = await createSale('user_1', {
 *   farmId: 'farm_A',
 *   livestockType: 'poultry',
 *   quantity: 50,
 *   unitPrice: 2500,
 *   date: new Date()
 * })
 * ```
 */
export async function createSale(
  userId: string,
  input: CreateSaleInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, input.farmId)

    const totalAmount = input.quantity * input.unitPrice

    // Use transaction to ensure batch quantity and sale are updated atomically
    const saleId = await db.transaction().execute(async (trx) => {
      // If selling from a batch, update the batch quantity
      if (input.batchId && input.livestockType !== 'eggs') {
        const batch = await trx
          .selectFrom('batches')
          .select(['id', 'currentQuantity', 'farmId'])
          .where('id', '=', input.batchId)
          .where('farmId', '=', input.farmId)
          .executeTakeFirst()

        if (!batch) {
          throw new AppError('BATCH_NOT_FOUND', {
            metadata: { batchId: input.batchId, farmId: input.farmId },
          })
        }

        if (batch.currentQuantity < input.quantity) {
          throw new AppError('INSUFFICIENT_STOCK', {
            metadata: {
              current: batch.currentQuantity,
              requested: input.quantity,
            },
          })
        }

        const newQuantity = batch.currentQuantity - input.quantity

        await trx
          .updateTable('batches')
          .set({
            currentQuantity: newQuantity,
            status: newQuantity === 0 ? 'sold' : 'active',
            updatedAt: new Date(),
          })
          .where('id', '=', input.batchId)
          .execute()
      }

      const result = await trx
        .insertInto('sales')
        .values({
          farmId: input.farmId,
          batchId: input.batchId || null,
          customerId: input.customerId || null,
          livestockType: input.livestockType,
          quantity: input.quantity,
          unitPrice: input.unitPrice.toString(),
          totalAmount: totalAmount.toString(),
          date: input.date,
          notes: input.notes || null,
          // Enhanced fields
          unitType: input.unitType || null,
          ageWeeks: input.ageWeeks || null,
          averageWeightKg: input.averageWeightKg?.toString() || null,
          paymentStatus: input.paymentStatus || 'paid',
          paymentMethod: input.paymentMethod || null,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      return result.id
    })

    // Log audit (outside transaction)
    const { logAudit } = await import('~/features/logging/audit')
    await logAudit({
      userId,
      action: 'create',
      entityType: 'sale',
      entityId: saleId,
      details: input,
    })

    return saleId
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create sale',
      cause: error,
    })
  }
}

// Server function for client-side calls
export const createSaleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { sale: CreateSaleInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createSale(session.user.id, data.sale)
  })

/**
 * Delete a sales record and revert its impact on batch quantity
 *
 * @param userId - ID of the user performing the deletion
 * @param saleId - ID of the sale to delete
 * @throws {Error} If sale is not found or access is denied
 *
 * @example
 * ```typescript
 * await deleteSale('user_1', 'sale_123')
 * ```
 */
export async function deleteSale(userId: string, saleId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const userFarms = await getUserFarms(userId)
    const farmIds = userFarms // userFarms is already an array of farm IDs

    // Get the sale to check ownership and possibly restore batch quantity
    const sale = await db
      .selectFrom('sales')
      .select(['id', 'farmId', 'batchId', 'quantity', 'livestockType'])
      .where('id', '=', saleId)
      .executeTakeFirst()

    if (!sale) {
      throw new AppError('SALE_NOT_FOUND', {
        metadata: { resource: 'Sale', id: saleId },
      })
    }

    if (!farmIds.includes(sale.farmId)) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: sale.farmId } })
    }

    // If sale was from a batch (not eggs), restore the quantity
    if (sale.batchId && sale.livestockType !== 'eggs') {
      await db
        .updateTable('batches')
        .set((eb) => ({
          currentQuantity: eb('currentQuantity', '+', sale.quantity),
          status: 'active',
          updatedAt: new Date(),
        }))
        .where('id', '=', sale.batchId)
        .execute()
    }

    await db.deleteFrom('sales').where('id', '=', saleId).execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete sale',
      cause: error,
    })
  }
}

// Server function for client-side calls
export const deleteSaleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { saleId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteSale(session.user.id, data.saleId)
  })

/**
 * Input data for updating an existing sales record
 */
export type UpdateSaleInput = {
  /** Updated quantity sold */
  quantity?: number
  /** Updated unit price */
  unitPrice?: number
  /** Updated transaction date */
  date?: Date
  /** Updated transaction notes */
  notes?: string | null
  // Enhanced fields
  /** Updated unit type */
  unitType?: UnitType | null
  /** Updated age in weeks */
  ageWeeks?: number | null
  /** Updated average weight in kg */
  averageWeightKg?: number | null
  /** Updated payment status */
  paymentStatus?: PaymentStatus | null
  /** Updated payment method */
  paymentMethod?: PaymentMethod | null
}

/**
 * Update an existing sales record
 *
 * @param userId - ID of the user performing the update
 * @param saleId - ID of the sale record to update
 * @param data - Updated sales data
 * @returns Promise resolving to true on success
 * @throws {Error} If sale is not found or access is denied
 *
 * @example
 * ```typescript
 * await updateSale('user_1', 'sale_123', { quantity: 60 })
 * ```
 */
export async function updateSale(
  userId: string,
  saleId: string,
  data: UpdateSaleInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    // Verify access
    const farmIds = await getUserFarms(userId) // string[]

    const sale = await db
      .selectFrom('sales')
      .select([
        'id',
        'farmId',
        'batchId',
        'quantity',
        'livestockType',
        'unitPrice',
      ])
      .where('id', '=', saleId)
      .executeTakeFirst()

    if (!sale) {
      throw new AppError('SALE_NOT_FOUND', {
        metadata: { resource: 'Sale', id: saleId },
      })
    }
    if (!farmIds.includes(sale.farmId)) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: sale.farmId } })
    }

    await db.transaction().execute(async (tx) => {
      // 1. If quantity changed, handle inventory
      if (
        data.quantity !== undefined &&
        data.quantity !== sale.quantity &&
        sale.batchId &&
        sale.livestockType !== 'eggs'
      ) {
        const quantityDiff = data.quantity - sale.quantity

        // Update batch
        await tx
          .updateTable('batches')
          .set((eb) => ({
            currentQuantity: eb('currentQuantity', '-', quantityDiff), // If diff is positive (increased sale), we subtract more.
            updatedAt: new Date(),
          }))
          .where('id', '=', sale.batchId)
          .execute()
      }

      // 2. Prepare update data
      const updateData: Record<string, unknown> = {}

      // Recalculate total amount if quantity or price changed
      const newQuantity = data.quantity ?? sale.quantity
      const newPrice = data.unitPrice ?? Number(sale.unitPrice)
      updateData.totalAmount = (newQuantity * newPrice).toString()

      // Copy over basic fields
      if (data.quantity !== undefined) updateData.quantity = data.quantity
      if (data.unitPrice !== undefined)
        updateData.unitPrice = data.unitPrice.toString()
      if (data.date !== undefined) updateData.date = data.date
      if (data.notes !== undefined) updateData.notes = data.notes

      // Copy over enhanced fields
      if (data.unitType !== undefined) updateData.unitType = data.unitType
      if (data.ageWeeks !== undefined) updateData.ageWeeks = data.ageWeeks
      if (data.averageWeightKg !== undefined)
        updateData.averageWeightKg = data.averageWeightKg?.toString() || null
      if (data.paymentStatus !== undefined)
        updateData.paymentStatus = data.paymentStatus
      if (data.paymentMethod !== undefined)
        updateData.paymentMethod = data.paymentMethod

      // 3. Update sale
      await tx
        .updateTable('sales')
        .set(updateData)
        .where('id', '=', saleId)
        .execute()
    })

    return true
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update sale',
      cause: error,
    })
  }
}

export const updateSaleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { saleId: string; data: UpdateSaleInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return updateSale(session.user.id, data.saleId, data.data)
  })

/**
 * Get sales for a user, optionally filtered by farm and other criteria
 *
 * @param userId - ID of the user requesting sales
 * @param farmId - Optional farm ID to filter by
 * @param options - Optional filters for date range and livestock type
 * @returns Promise resolving to an array of sales records
 * @throws {Error} If user lacks access to the farm
 *
 * @example
 * ```typescript
 * const sales = await getSales('user_1', 'farm_A', { livestockType: 'poultry' })
 * ```
 */
export async function getSales(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
    livestockType?: 'poultry' | 'fish' | 'eggs'
  },
) {
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

    let query = db
      .selectFrom('sales')
      .leftJoin('customers', 'customers.id', 'sales.customerId')
      .leftJoin('batches', 'batches.id', 'sales.batchId')
      .leftJoin('farms', 'farms.id', 'sales.farmId')
      .select([
        'sales.id',
        'sales.farmId',
        'sales.batchId',
        'sales.customerId',
        'sales.livestockType',
        'sales.quantity',
        'sales.unitPrice',
        'sales.totalAmount',
        'sales.date',
        'sales.notes',
        'sales.createdAt',
        'customers.name as customerName',
        'batches.species as batchSpecies',
        'farms.name as farmName',
      ])
      .where('sales.farmId', 'in', targetFarmIds)

    if (options?.startDate) {
      query = query.where('sales.date', '>=', options.startDate)
    }
    if (options?.endDate) {
      query = query.where('sales.date', '<=', options.endDate)
    }
    if (options?.livestockType) {
      query = query.where('sales.livestockType', '=', options.livestockType)
    }

    return await query.orderBy('sales.date', 'desc').execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch sales',
      cause: error,
    })
  }
}

/**
 * Get all sales for a specific farm
 *
 * @param userId - ID of the user requesting sales
 * @param farmId - ID of the farm
 * @param options - Optional filters for date range and livestock type
 * @returns Promise resolving to an array of sales records
 * @throws {Error} If user lacks access to the farm
 *
 * @example
 * ```typescript
 * const sales = await getSalesForFarm('user_1', 'farm_A', { startDate: new Date('2024-01-01') })
 * ```
 */
export async function getSalesForFarm(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    livestockType?: 'poultry' | 'fish' | 'eggs'
  },
) {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    let query = db
      .selectFrom('sales')
      .leftJoin('customers', 'customers.id', 'sales.customerId')
      .leftJoin('batches', 'batches.id', 'sales.batchId')
      .select([
        'sales.id',
        'sales.farmId',
        'sales.batchId',
        'sales.customerId',
        'sales.livestockType',
        'sales.quantity',
        'sales.unitPrice',
        'sales.totalAmount',
        'sales.date',
        'sales.notes',
        'sales.createdAt',
        'customers.name as customerName',
        'batches.species as batchSpecies',
      ])
      .where('sales.farmId', '=', farmId)

    if (options?.startDate) {
      query = query.where('sales.date', '>=', options.startDate)
    }
    if (options?.endDate) {
      query = query.where('sales.date', '<=', options.endDate)
    }
    if (options?.livestockType) {
      query = query.where('sales.livestockType', '=', options.livestockType)
    }

    return await query.orderBy('sales.date', 'desc').execute()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch sales for farm',
      cause: error,
    })
  }
}

/**
 * Get a summary of sales (counts, quantities, revenue) grouped by livestock type
 *
 * @param userId - ID of the user requesting the summary
 * @param farmId - Optional farm ID to filter by
 * @param options - Optional date range filters
 * @returns Promise resolving to a sales summary object
 *
 * @example
 * ```typescript
 * const summary = await getSalesSummary('user_1', 'farm_A')
 * console.log(summary.poultry.revenue)
 * ```
 */
export async function getSalesSummary(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
) {
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
      if (targetFarmIds.length === 0) {
        return {
          poultry: { count: 0, quantity: 0, revenue: 0 },
          fish: { count: 0, quantity: 0, revenue: 0 },
          eggs: { count: 0, quantity: 0, revenue: 0 },
          total: { count: 0, quantity: 0, revenue: 0 },
        }
      }
    }

    let query = db
      .selectFrom('sales')
      .select([
        'livestockType',
        db.fn.count('id').as('count'),
        db.fn.sum<string>('quantity').as('totalQuantity'),
        db.fn.sum<string>('totalAmount').as('totalRevenue'),
      ])
      .where('farmId', 'in', targetFarmIds)
      .groupBy('livestockType')

    if (options?.startDate) {
      query = query.where('date', '>=', options.startDate)
    }
    if (options?.endDate) {
      query = query.where('date', '<=', options.endDate)
    }

    const results = await query.execute()

    const summary = {
      poultry: { count: 0, quantity: 0, revenue: 0 },
      fish: { count: 0, quantity: 0, revenue: 0 },
      eggs: { count: 0, quantity: 0, revenue: 0 },
      total: { count: 0, quantity: 0, revenue: 0 },
    }

    for (const row of results) {
      const type = row.livestockType as keyof typeof summary
      if (type in summary) {
        summary[type] = {
          count: Number(row.count),
          quantity: Number(row.totalQuantity),
          revenue: parseFloat(row.totalRevenue),
        }
        summary.total.count += Number(row.count)
        summary.total.quantity += Number(row.totalQuantity)
        summary.total.revenue += parseFloat(row.totalRevenue)
      }
    }

    return summary
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to get sales summary',
      cause: error,
    })
  }
}

/**
 * Calculate total revenue for a farm within a given period
 *
 * @param userId - ID of the user requesting the calculation
 * @param farmId - ID of the farm
 * @param options - Optional date range filters
 * @returns Promise resolving to the total revenue amount
 *
 * @example
 * ```typescript
 * const revenue = await getTotalRevenue('user_1', 'farm_A', { startDate: weekStart })
 * ```
 */
export async function getTotalRevenue(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    await verifyFarmAccess(userId, farmId)

    let query = db
      .selectFrom('sales')
      .select(db.fn.sum<string>('totalAmount').as('total'))
      .where('farmId', '=', farmId)

    if (options?.startDate) {
      query = query.where('date', '>=', options.startDate)
    }
    if (options?.endDate) {
      query = query.where('date', '<=', options.endDate)
    }

    const result = await query.executeTakeFirst()
    return parseFloat(result?.total || '0')
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to calculate total revenue',
      cause: error,
    })
  }
}

/**
 * Paginated sales query with sorting and search
 */
export interface SalesQuery extends BasePaginatedQuery {
  batchId?: string
  livestockType?: string
  paymentStatus?: string
}

/**
 * Perform a paginated query for sales with support for searching, sorting, and filtering
 *
 * @param userId - ID of the user performing the query
 * @param query - Pagination and filter parameters
 * @returns Promise resolving to a paginated result set
 *
 * @example
 * ```typescript
 * const result = await getSalesPaginated('user_1', { page: 1, pageSize: 20, livestockType: 'poultry' })
 * ```
 */
export async function getSalesPaginated(
  userId: string,
  query: SalesQuery = {},
): Promise<
  PaginatedResult<{
    id: string
    farmId: string
    farmName: string | null
    customerId: string | null
    customerName: string | null
    livestockType: string
    quantity: number
    unitPrice: string
    totalAmount: string
    date: Date
    notes: string | null
    batchSpecies: string | null
    unitType: string | null
    ageWeeks: number | null
    averageWeightKg: string | null
    paymentStatus: string | null
    paymentMethod: string | null
  }>
> {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')
  const { checkFarmAccess, getUserFarms } =
    await import('~/features/auth/utils')
  const { AppError } = await import('~/lib/errors')

  try {
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const sortBy = query.sortBy || 'date'
    const sortOrder = query.sortOrder || 'desc'
    const search = query.search || ''
    const livestockType = query.livestockType
    const paymentStatus = query.paymentStatus

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
      .selectFrom('sales')
      .leftJoin('customers', 'customers.id', 'sales.customerId')
      .leftJoin('batches', 'batches.id', 'sales.batchId')
      .leftJoin('farms', 'farms.id', 'sales.farmId')
      .where('sales.farmId', 'in', targetFarmIds)

    // Apply search filter
    if (search) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('customers.name', 'ilike', `%${search}%`),
          eb('batches.species', 'ilike', `%${search}%`),
          eb('sales.notes', 'ilike', `%${search}%`),
        ]),
      )
    }

    // Apply type filter
    if (livestockType) {
      countQuery = countQuery.where(
        'sales.livestockType',
        '=',
        livestockType as any,
      )
    }

    // Apply payment status filter
    if (paymentStatus) {
      countQuery = countQuery.where(
        'sales.paymentStatus',
        '=',
        paymentStatus as any,
      )
    }

    // Apply batchId filter
    if (query.batchId) {
      countQuery = countQuery.where('sales.batchId', '=', query.batchId)
    }

    // Get total count
    const countResult = await countQuery
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst()
    const total = Number(countResult?.count || 0)
    const totalPages = Math.ceil(total / pageSize)

    // Apply sorting
    const sortColumn =
      sortBy === 'totalAmount'
        ? 'sales.totalAmount'
        : sortBy === 'quantity'
          ? 'sales.quantity'
          : sortBy === 'customerName'
            ? 'customers.name'
            : sortBy === 'livestockType'
              ? 'sales.livestockType'
              : 'sales.date'

    let dataQuery = db
      .selectFrom('sales')
      .leftJoin('customers', 'customers.id', 'sales.customerId')
      .leftJoin('batches', 'batches.id', 'sales.batchId')
      .leftJoin('farms', 'farms.id', 'sales.farmId')
      .select([
        'sales.id',
        'sales.farmId',
        'sales.customerId',
        'sales.livestockType',
        'sales.quantity',
        'sales.unitPrice',
        'sales.totalAmount',
        'sales.unitType',
        'sales.ageWeeks',
        'sales.averageWeightKg',
        'sales.paymentStatus',
        'sales.paymentMethod',
        'sales.date',
        'sales.notes',
        'customers.name as customerName',
        'batches.species as batchSpecies',
        'farms.name as farmName',
      ])
      .where('sales.farmId', 'in', targetFarmIds)

    // Re-apply filters
    if (search) {
      dataQuery = dataQuery.where((eb) =>
        eb.or([
          eb('customers.name', 'ilike', `%${search}%`),
          eb('batches.species', 'ilike', `%${search}%`),
          eb('sales.notes', 'ilike', `%${search}%`),
        ]),
      )
    }
    if (livestockType) {
      dataQuery = dataQuery.where(
        'sales.livestockType',
        '=',
        livestockType as any,
      )
    }
    if (paymentStatus) {
      dataQuery = dataQuery.where(
        'sales.paymentStatus',
        '=',
        paymentStatus as any,
      )
    }
    if (query.batchId) {
      dataQuery = dataQuery.where('sales.batchId', '=', query.batchId)
    }

    // Apply sorting and pagination
    const data = await dataQuery
      .orderBy(sortColumn as any, sortOrder)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute()

    return {
      data: data.map((d) => ({
        ...d,
        farmName: d.farmName || null,
        customerName: d.customerName || null,
        batchSpecies: d.batchSpecies || null,
      })),
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch sales',
      cause: error,
    })
  }
}

// Server function for paginated sales
export const getSalesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: SalesQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getSalesPaginated(session.user.id, data)
  })

// Server function for sales summary
export const getSalesSummaryFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { farmId?: string; startDate?: Date; endDate?: Date }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getSalesSummary(session.user.id, data.farmId, {
      startDate: data.startDate,
      endDate: data.endDate,
    })
  })
