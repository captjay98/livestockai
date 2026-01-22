import { createServerFn } from '@tanstack/react-start'
import * as repository from './repository'
import * as service from './service'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Represents a supplier record with aggregated spending metrics.
 */
export interface SupplierRecord {
  /** Unique identifier for the supplier */
  id: string
  /** Name of the supplier or business entity */
  name: string
  /** Primary contact phone number */
  phone: string
  /** Optional contact email address */
  email: string | null
  /** Optional physical address or headquarters */
  location: string | null
  /** List of products or services provided by this supplier */
  products: Array<string>
  /** Specific classification (e.g., hatchery, feed mill) */
  supplierType: string | null
  /** Timestamp when the supplier was registered */
  createdAt: Date
  /** Aggregate total amount spent with this supplier in system currency */
  totalSpent?: number
  expenseCount?: number
}

/**
 * Data structure for creating a new supplier record.
 */
export interface CreateSupplierInput {
  /** Supplier's full name */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional contact email */
  email?: string | null
  /** Optional location description */
  location?: string | null
  /** List of products supplied */
  products: Array<string>
  /** Category of supply provided */
  supplierType?:
    | 'hatchery'
    | 'feed_mill'
    | 'pharmacy'
    | 'equipment'
    | 'fingerlings'
    | 'cattle_dealer'
    | 'goat_dealer'
    | 'sheep_dealer'
    | 'bee_supplier'
    | 'other'
    | null
}

/**
 * Filter and pagination parameters for querying suppliers.
 */
export interface SupplierQuery extends BasePaginatedQuery {
  /** Filter by a specific supplier classification */
  supplierType?: string
}

/**
 * Register a new supplier in the system.
 */
export async function createSupplier(
  input: CreateSupplierInput,
): Promise<string> {
  const { db } = await import('~/lib/db')

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
  .inputValidator((data: CreateSupplierInput) => data)
  .handler(async ({ data }) => {
    return createSupplier(data)
  })

/**
 * Retrieve all suppliers in alphabetical order.
 */
export async function getSuppliers(): Promise<Array<SupplierRecord>> {
  const { db } = await import('~/lib/db')

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
export const getSuppliersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getSuppliers()
  },
)

/**
 * Retrieve a single supplier record by its unique ID.
 */
export async function getSupplierById(supplierId: string) {
  const { db } = await import('~/lib/db')

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
  const { db } = await import('~/lib/db')

  try {
    // Validate input if provided
    if (Object.keys(input).length > 0) {
      const validationError = service.validateSupplierData(
        input as CreateSupplierInput,
      )
      if (validationError) {
        throw new AppError('VALIDATION_ERROR', { message: validationError })
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
  .inputValidator(
    (data: { id: string; data: Partial<CreateSupplierInput> }) => data,
  )
  .handler(async ({ data }) => {
    return updateSupplier(data.id, data.data)
  })

/**
 * Permanently remove a supplier record from the system.
 */
export async function deleteSupplier(supplierId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    await repository.deleteSupplier(db, supplierId)
  } catch (error) {
    console.error('Failed to delete supplier:', error)
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
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return deleteSupplier(data.id)
  })

/**
 * Retrieve a supplier's profile along with a history of all tracked expenses (sourcing).
 */
export async function getSupplierWithExpenses(supplierId: string) {
  const { db } = await import('~/lib/db')

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
  const { db } = await import('~/lib/db')

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
  .inputValidator((data: SupplierQuery) => data)
  .handler(async ({ data }) => {
    return getSuppliersPaginated(data)
  })
