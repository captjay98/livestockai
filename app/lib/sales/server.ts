import { createServerFn } from '@tanstack/react-start'

export interface CreateSaleInput {
  farmId: string
  batchId?: string | null
  customerId?: string | null
  livestockType: 'poultry' | 'fish' | 'eggs'
  quantity: number
  unitPrice: number
  date: Date
  notes?: string | null
}

export async function createSale(
  userId: string,
  input: CreateSaleInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

  await verifyFarmAccess(userId, input.farmId)

  const totalAmount = input.quantity * input.unitPrice

  // If selling from a batch, update the batch quantity
  if (input.batchId && input.livestockType !== 'eggs') {
    const batch = await db
      .selectFrom('batches')
      .select(['id', 'currentQuantity', 'farmId'])
      .where('id', '=', input.batchId)
      .where('farmId', '=', input.farmId)
      .executeTakeFirst()

    if (!batch) {
      throw new Error('Batch not found or does not belong to this farm')
    }

    if (batch.currentQuantity < input.quantity) {
      throw new Error('Quantity exceeds available stock')
    }

    const newQuantity = batch.currentQuantity - input.quantity

    await db
      .updateTable('batches')
      .set({
        currentQuantity: newQuantity,
        status: newQuantity === 0 ? 'sold' : 'active',
        updatedAt: new Date(),
      })
      .where('id', '=', input.batchId)
      .execute()
  }

  const result = await db
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
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return result.id
}

// Server function for client-side calls
export const createSaleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { sale: CreateSaleInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return createSale(session.user.id, data.sale)
  })

/**
 * Delete a sale record
 */
export async function deleteSale(userId: string, saleId: string) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  const userFarms = await getUserFarms(userId)
  const farmIds = userFarms.map(f => f.id)

  // Get the sale to check ownership and possibly restore batch quantity
  const sale = await db
    .selectFrom('sales')
    .select(['id', 'farmId', 'batchId', 'quantity', 'livestockType'])
    .where('id', '=', saleId)
    .executeTakeFirst()

  if (!sale) {
    throw new Error('Sale not found')
  }

  if (!farmIds.includes(sale.farmId)) {
    throw new Error('Not authorized to delete this sale')
  }

  // If sale was from a batch (not eggs), restore the quantity
  if (sale.batchId && sale.livestockType !== 'eggs') {
    await db
      .updateTable('batches')
      .set(eb => ({
        currentQuantity: eb('currentQuantity', '+', sale.quantity),
        status: 'active',
        updatedAt: new Date(),
      }))
      .where('id', '=', sale.batchId)
      .execute()
  }

  await db.deleteFrom('sales').where('id', '=', saleId).execute()
}

// Server function for client-side calls
export const deleteSaleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { saleId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return deleteSale(session.user.id, data.saleId)
  })

export type UpdateSaleInput = {
  quantity?: number
  unitPrice?: number
  date?: Date
  notes?: string | null
}

export async function updateSale(
  userId: string,
  saleId: string,
  data: UpdateSaleInput,
) {
  const { db } = await import('~/lib/db')
  const { getUserFarms } = await import('~/lib/auth/utils')

  // Verify access
  const farmIds = await getUserFarms(userId) // string[]

  const sale = await db
    .selectFrom('sales')
    .select(['id', 'farmId', 'batchId', 'quantity', 'livestockType', 'unitPrice'])
    .where('id', '=', saleId)
    .executeTakeFirst()

  if (!sale) throw new Error('Sale not found')
  if (!farmIds.includes(sale.farmId)) throw new Error('Unauthorized')

  await db.transaction().execute(async (tx) => {
    // 1. If quantity changed, handle inventory
    if (data.quantity !== undefined && data.quantity !== sale.quantity && sale.batchId && sale.livestockType !== 'eggs') {
      const quantityDiff = data.quantity - sale.quantity

      // Update batch
      await tx
        .updateTable('batches')
        .set((eb) => ({
          currentQuantity: eb('currentQuantity', '-', quantityDiff), // If diff is positive (increased sale), we subtract more. 
          updatedAt: new Date(),
        }))
        .where('id', '=', sale.batchId!)
        .execute()
    }

    // 2. Prepare update data
    const updateData: any = { ...data }

    // Recalculate total amount if quantity or price changed
    const newQuantity = data.quantity ?? sale.quantity
    const newPrice = data.unitPrice ?? Number(sale.unitPrice)
    updateData.totalAmount = (newQuantity * newPrice).toString()

    // 3. Update sale
    await tx
      .updateTable('sales')
      .set(updateData)
      .where('id', '=', saleId)
      .execute()
  })

  return true
}

export const updateSaleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { saleId: string; data: UpdateSaleInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return updateSale(session.user.id, data.saleId, data.data)
  })

/**
 * Get sales for a user - optionally filtered by farm (All Farms Support)
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
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
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
      'farms.name as farmName'
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

  return query.orderBy('sales.date', 'desc').execute()
}


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
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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

  return query.orderBy('sales.date', 'desc').execute()
}

export async function getSalesSummary(
  userId: string,
  farmId?: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
) {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  let targetFarmIds: string[] = []

  if (farmId) {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) throw new Error('Access denied')
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
}

export async function getTotalRevenue(
  userId: string,
  farmId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  },
): Promise<number> {
  const { db } = await import('~/lib/db')
  const { verifyFarmAccess } = await import('~/lib/auth/utils')

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
}

/**
 * Paginated sales query with sorting and search
 */
export interface PaginatedQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  farmId?: string
  batchId?: string
  livestockType?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getSalesPaginated(
  userId: string,
  query: PaginatedQuery = {},
): Promise<PaginatedResult<{
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
}>> {
  const { db } = await import('~/lib/db')
  const { sql } = await import('kysely')
  const { checkFarmAccess, getUserFarms } = await import('~/lib/auth/utils')

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const sortBy = query.sortBy || 'date'
  const sortOrder = query.sortOrder || 'desc'
  const search = query.search || ''
  const livestockType = query.livestockType

  // Determine target farms
  let targetFarmIds: string[] = []
  if (query.farmId) {
    const hasAccess = await checkFarmAccess(userId, query.farmId)
    if (!hasAccess) throw new Error('Access denied')
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
      ])
    )
  }

  // Apply type filter
  if (livestockType) {
    countQuery = countQuery.where('sales.livestockType', '=', livestockType as any)
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
    sortBy === 'totalAmount' ? 'sales.totalAmount' :
      sortBy === 'quantity' ? 'sales.quantity' :
        sortBy === 'customerName' ? 'customers.name' :
          sortBy === 'livestockType' ? 'sales.livestockType' :
            'sales.date'

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
      ])
    )
  }
  if (livestockType) {
    dataQuery = dataQuery.where('sales.livestockType', '=', livestockType as any)
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
    data: data.map(d => ({
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
}

// Server function for paginated sales
export const getSalesPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: PaginatedQuery) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/lib/auth/server-middleware')
    const session = await requireAuth()
    return getSalesPaginated(session.user.id, data)
  })
