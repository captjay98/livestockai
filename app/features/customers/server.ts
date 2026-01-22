import { createServerFn } from '@tanstack/react-start'
import * as repository from './repository'
import * as service from './service'
import type { BasePaginatedQuery, PaginatedResult } from '~/lib/types'
import { AppError } from '~/lib/errors'

export type { PaginatedResult }

/**
 * Represents a customer record with aggregated sales metrics.
 * Used for CRM and reporting.
 */
export interface CustomerRecord {
  /** Unique identifier for the customer */
  id: string
  /** Full name of the customer or business */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional email address */
  email: string | null
  /** Optional physical or delivery address */
  location: string | null
  /**
   * Categorization of the customer.
   * Helps in targeted marketing and pricing.
   */
  customerType: string | null
  /** Timestamp when the customer was first recorded */
  createdAt: Date
  /** Aggregate count of sales made to this customer */
  salesCount: number
  /** Aggregate total amount spent by this customer in system currency */
  totalSpent: number
}

/**
 * Data structure for creating a new customer record.
 */
export interface CreateCustomerInput {
  /** ID of the farm this customer belongs to */
  farmId: string
  /** Customer's full name */
  name: string
  /** Contact phone number */
  phone: string
  /** Optional contact email */
  email?: string | null
  /** Optional delivery or business address */
  location?: string | null
  /** Optional classification of the customer */
  customerType?: 'individual' | 'restaurant' | 'retailer' | 'wholesaler' | null
}

/**
 * Filter and pagination parameters for querying customers.
 */
export interface CustomerQuery extends BasePaginatedQuery {
  /** Filter by a specific customer classification */
  customerType?: string
}

/**
 * Register a new customer in the system.
 */
export async function createCustomer(
  input: CreateCustomerInput,
): Promise<string> {
  const { db } = await import('~/lib/db')

  try {
    // Validate input
    const validationError = service.validateCustomerData(input)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', { message: validationError })
    }

    return await repository.insertCustomer(db, input)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create customer',
      cause: error,
    })
  }
}

/**
 * Server function to create a customer record.
 */
export const createCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateCustomerInput) => data)
  .handler(async ({ data }) => {
    return createCustomer(data)
  })

/**
 * Retrieve all customers in alphabetical order.
 */
export async function getCustomers() {
  const { db } = await import('~/lib/db')

  try {
    const customers = await repository.selectAllCustomers(db)
    // Add default aggregates for simple list
    return customers.map((c) => ({
      ...c,
      salesCount: 0,
      totalSpent: 0,
    }))
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch customers',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve all customers (unpaginated).
 */
export const getCustomersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getCustomers()
  },
)

/**
 * Retrieve a single customer record by its unique ID.
 */
export async function getCustomerById(customerId: string) {
  const { db } = await import('~/lib/db')

  try {
    return await repository.selectCustomerById(db, customerId)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch customer',
      cause: error,
    })
  }
}

/**
 * Update an existing customer's details.
 */
export async function updateCustomer(
  customerId: string,
  input: Partial<CreateCustomerInput>,
): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    await repository.updateCustomer(db, customerId, input)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to update customer',
      cause: error,
    })
  }
}

/**
 * Server function to update a customer record.
 */
export const updateCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; data: Partial<CreateCustomerInput> }) => data,
  )
  .handler(async ({ data }) => {
    return updateCustomer(data.id, data.data)
  })

/**
 * Permanently remove a customer record from the system.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    await repository.deleteCustomer(db, customerId)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete customer',
      cause: error,
    })
  }
}

/**
 * Server function to delete a customer record.
 */
export const deleteCustomerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return deleteCustomer(data.id)
  })

/**
 * Retrieve a customer's full profile including their entire purchase history.
 */
export async function getCustomerWithSales(customerId: string) {
  const { db } = await import('~/lib/db')

  try {
    const customer = await repository.selectCustomerById(db, customerId)
    if (!customer) return null

    const sales = await repository.selectCustomerSales(db, customerId)
    const totalSpent = sales.reduce(
      (sum, s) => sum + parseFloat(s.totalAmount),
      0,
    )

    return {
      ...customer,
      sales,
      totalSpent,
      salesCount: sales.length,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch customer details',
      cause: error,
    })
  }
}

/**
 * Retrieve a list of customers ranked by their lifetime spending.
 */
export async function getTopCustomers(limit: number = 10) {
  const { db } = await import('~/lib/db')

  try {
    return await repository.selectTopCustomers(db, limit)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch top customers',
      cause: error,
    })
  }
}

/**
 * Retrieve a paginated list of customers with search and filter capabilities.
 */
export async function getCustomersPaginated(query: CustomerQuery = {}) {
  const { db } = await import('~/lib/db')

  try {
    return await repository.selectCustomersPaginated(db, query)
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch paginated customers',
      cause: error,
    })
  }
}

/**
 * Server function to retrieve paginated customer records.
 */
export const getCustomersPaginatedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: CustomerQuery) => data)
  .handler(async ({ data }) => {
    return getCustomersPaginated(data)
  })
