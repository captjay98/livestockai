import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import * as repository from './repository'
import * as service from './service'
import type {
  CreateSupplierInput,
  PaginatedResult,
  SupplierQuery,
  SupplierRecord,
  SupplierSearchParams,
} from './types'
import { AppError } from '~/lib/errors'

// Zod validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  products: z.array(z.string()).min(1, 'At least one product is required'),
  supplierType: z
    .enum([
      'hatchery',
      'feed_mill',
      'pharmacy',
      'equipment',
      'fingerlings',
      'cattle_dealer',
      'goat_dealer',
      'sheep_dealer',
      'bee_supplier',
      'other',
    ])
    .nullable()
    .optional(),
})

const updateSupplierSchema = z.object({
  id: z.string().uuid(),
  data: createSupplierSchema.partial(),
})

const deleteSupplierSchema = z.object({
  id: z.string().uuid(),
})

const supplierQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  supplierType: z.string().optional(),
  farmId: z.string().uuid().optional(),
})

export type {
  PaginatedResult,
  SupplierSearchParams,
  CreateSupplierInput,
  SupplierQuery,
  SupplierRecord,
}

/**
 * Validate supplier search parameters
 */
export function validateSupplierSearch(
  search: Record<string, unknown>,
): SupplierSearchParams {
  const validSortBy = [
    'name',
    'phone',
    'email',
    'location',
    'supplierType',
    'createdAt',
    'totalSpent',
    'orderCount',
  ] as const
  return {
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    sortBy:
      typeof search.sortBy === 'string' &&
      (validSortBy as ReadonlyArray<string>).includes(search.sortBy)
        ? search.sortBy
        : 'totalSpent',
    sortOrder:
      typeof search.sortOrder === 'string' &&
      (search.sortOrder === 'asc' || search.sortOrder === 'desc')
        ? search.sortOrder
        : 'desc',
    q: typeof search.q === 'string' ? search.q : '',
    supplierType:
      typeof search.supplierType === 'string' ? search.supplierType : undefined,
  }
}

/**
 * Register a new supplier in the system.
 */
export async function createSupplier(
  input: CreateSupplierInput,
): Promise<string> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    // Validate input
    const validationError = service.validateSupplierData(input)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', { message: validationError })
    }

    return await repository.insertSupplier(db, input)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create supplier',
      cause: error,
    })
  }
}

/**
 * Server function to create a supplier record.
 */
export const createSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(createSupplierSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    return createSupplier(data)
  })

/**
 * Retrieve all suppliers in alphabetical order.
 */
export async function getSuppliers(): Promise<Array<SupplierRecord>> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    return await repository.selectAllSuppliers(db)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch suppliers',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve all suppliers (unpaginated).
 */
export const getSuppliersFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ farmId: z.string().uuid().optional() }))
  .handler(async () => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    return getSuppliers()
  })

/**
 * Retrieve a single supplier record by its unique ID.
 */
export async function getSupplierById(supplierId: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    return await repository.selectSupplierById(db, supplierId)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch supplier',
      cause: error,
    })
  }
}

/**
 * Update an existing supplier's details.
 */
export async function updateSupplier(
  supplierId: string,
  input: Partial<CreateSupplierInput>,
): Promise<void> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    // Validate input if provided
    if (Object.keys(input).length > 0) {
      const validationError = service.validateSupplierData(
        input as CreateSupplierInput,
      )
      if (validationError) {
        throw new AppError('VALIDATION_ERROR', {
          message: validationError,
        })
      }
    }

    await repository.updateSupplier(db, supplierId, input)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update supplier',
      cause: error,
    })
  }
}

/**
 * Server function to update a supplier record.
 */
export const updateSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(updateSupplierSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    return updateSupplier(data.id, data.data)
  })

/**
 * Permanently remove a supplier record from the system.
 */
export async function deleteSupplier(supplierId: string): Promise<void> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    await repository.deleteSupplier(db, supplierId)
  } catch (error) {
    if (String(error).includes('foreign key constraint')) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Cannot delete supplier with existing expenses',
        cause: error,
      })
    }
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete supplier',
      cause: error,
    })
  }
}

/**
 * Server function to delete a supplier record.
 */
export const deleteSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteSupplierSchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    return deleteSupplier(data.id)
  })

/**
 * Retrieve a supplier's profile along with a history of all tracked expenses (sourcing).
 */
export async function getSupplierWithExpenses(supplierId: string) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    const supplier = await repository.selectSupplierById(db, supplierId)
    if (!supplier) return null

    const expenses = await repository.selectSupplierExpenses(db, supplierId)
    const totalSpent = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0,
    )

    return {
      ...supplier,
      expenses,
      totalSpent,
      expenseCount: expenses.length,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch supplier details',
      cause: error,
    })
  }
}

/**
 * Retrieve a paginated list of suppliers with search and classification filtering.
 */
export async function getSuppliersPaginated(query: SupplierQuery = {}) {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  try {
    return await repository.selectSuppliersPaginated(db, query)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated suppliers',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated supplier records.
 */
export const getSuppliersPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator(supplierQuerySchema)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    await requireAuth()
    return getSuppliersPaginated(data)
  })
