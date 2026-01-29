/**
 * Business logic for supplier operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { CreateSupplierInput, SupplierQuery } from './server'

const VALID_SUPPLIER_TYPES = [
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
] as const

export type ValidSupplierType = (typeof VALID_SUPPLIER_TYPES)[number]

/**
 * Validate supplier input data
 * Returns validation error message or null if valid
 */
export function validateSupplierData(data: CreateSupplierInput): string | null {
  if (!data.name || data.name.trim() === '') {
    return 'Supplier name is required'
  }

  if (data.name.length > 255) {
    return 'Supplier name must be less than 255 characters'
  }

  if (!data.phone || data.phone.trim() === '') {
    return 'Phone number is required'
  }

  if (data.phone.length > 50) {
    return 'Phone number must be less than 50 characters'
  }

  if (data.email && data.email.length > 255) {
    return 'Email must be less than 255 characters'
  }

  if (data.email && !isValidEmail(data.email)) {
    return 'Invalid email format'
  }

  if (data.location && data.location.length > 500) {
    return 'Location must be less than 500 characters'
  }

  if (data.products.length === 0) {
    return 'At least one product is required'
  }

  if (data.products.some((p) => p.trim() === '')) {
    return 'Products must be non-empty strings'
  }

  if (data.supplierType && !VALID_SUPPLIER_TYPES.includes(data.supplierType)) {
    return `Invalid supplier type. Must be one of: ${VALID_SUPPLIER_TYPES.join(', ')}`
  }

  return null
}

/**
 * Validate pagination query parameters
 */
export function validateSupplierQuery(
  query: SupplierQuery,
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

/**
 * Simple email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
