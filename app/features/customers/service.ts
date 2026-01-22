/**
 * Business logic for customer operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateCustomerInput, CustomerQuery } from './server'

/**
 * Validate customer input data
 * Returns validation error message or null if valid
 */
export function validateCustomerData(
  data: CreateCustomerInput,
): string | null {
  if (!data.farmId || data.farmId.trim() === '') {
    return 'Farm ID is required'
  }

  if (!data.name || data.name.trim() === '') {
    return 'Customer name is required'
  }

  if (!data.phone || data.phone.trim() === '') {
    return 'Phone number is required'
  }

  if (data.email && data.email.length > 255) {
    return 'Email must be less than 255 characters'
  }

  if (data.location && data.location.length > 500) {
    return 'Location must be less than 500 characters'
  }

  return null
}

/**
 * Validate pagination query parameters
 */
export function validateCustomerQuery(
  query: CustomerQuery,
): { page: number; pageSize: number } | null {
  const page = query.page || 1
  const pageSize = query.pageSize || 10

  if (page < 1) {
    return null
  }

  if (pageSize < 1 || pageSize > 100) {
    return null
  }

  return { page, pageSize }
}
