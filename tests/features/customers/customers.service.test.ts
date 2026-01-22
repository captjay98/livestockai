import { describe, expect, it } from 'vitest'
import type { CreateCustomerInput } from '~/features/customers/server'
import {
  validateCustomerData,
  validateCustomerQuery,
} from '~/features/customers/service'

describe('Customers Service', () => {
  const createValidCustomer = (
    overrides?: Partial<CreateCustomerInput>,
  ): CreateCustomerInput => ({
    farmId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Customer',
    phone: '+1234567890',
    email: 'test@customer.com',
    location: '123 Test Street',
    customerType: 'wholesale',
    ...overrides,
  })

  describe('validateCustomerData', () => {
    it('should accept valid customer data', () => {
      const result = validateCustomerData(createValidCustomer())
      expect(result).toBeNull()
    })

    it('should reject empty farmId', () => {
      const result = validateCustomerData(createValidCustomer({ farmId: '' }))
      expect(result).toBe('Farm ID is required')
    })

    it('should reject whitespace-only farmId', () => {
      const result = validateCustomerData(createValidCustomer({ farmId: '   ' }))
      expect(result).toBe('Farm ID is required')
    })

    it('should reject empty name', () => {
      const result = validateCustomerData(createValidCustomer({ name: '' }))
      expect(result).toBe('Customer name is required')
    })

    it('should reject whitespace-only name', () => {
      const result = validateCustomerData(createValidCustomer({ name: '   ' }))
      expect(result).toBe('Customer name is required')
    })

    it('should accept long name (255 chars)', () => {
      const result = validateCustomerData(
        createValidCustomer({ name: 'a'.repeat(255) }),
      )
      expect(result).toBeNull()
    })

    it('should reject empty phone', () => {
      const result = validateCustomerData(createValidCustomer({ phone: '' }))
      expect(result).toBe('Phone number is required')
    })

    it('should reject whitespace-only phone', () => {
      const result = validateCustomerData(createValidCustomer({ phone: '   ' }))
      expect(result).toBe('Phone number is required')
    })

    it('should accept valid email format', () => {
      const result = validateCustomerData(
        createValidCustomer({ email: 'customer@example.com' }),
      )
      expect(result).toBeNull()
    })

    it('should accept email as undefined', () => {
      const result = validateCustomerData(
        createValidCustomer({ email: undefined }),
      )
      expect(result).toBeNull()
    })

    it('should accept email as null', () => {
      const result = validateCustomerData(createValidCustomer({ email: null as any }))
      expect(result).toBeNull()
    })

    // Note: Customer service validates email length but not format
    it('should reject email exceeding 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      const result = validateCustomerData(
        createValidCustomer({ email: longEmail }),
      )
      expect(result).toBe('Email must be less than 255 characters')
    })

    it('should accept location as undefined', () => {
      const result = validateCustomerData(
        createValidCustomer({ location: undefined }),
      )
      expect(result).toBeNull()
    })

    it('should accept location as null', () => {
      const result = validateCustomerData(createValidCustomer({ location: null as any }))
      expect(result).toBeNull()
    })

    it('should accept location at 500 characters', () => {
      const result = validateCustomerData(
        createValidCustomer({ location: 'a'.repeat(500) }),
      )
      expect(result).toBeNull()
    })

    it('should accept customerType as undefined', () => {
      const result = validateCustomerData(
        createValidCustomer({ customerType: undefined }),
      )
      expect(result).toBeNull()
    })

    it('should accept customerType as null', () => {
      const result = validateCustomerData(
        createValidCustomer({ customerType: null as any }),
      )
      expect(result).toBeNull()
    })

    it('should accept various customer types', () => {
      const types = ['retail', 'wholesale', 'restaurant', 'individual', 'other']
      for (const type of types) {
        const result = validateCustomerData(
          createValidCustomer({ customerType: type }),
        )
        expect(result).toBeNull()
      }
    })
  })

  describe('validateCustomerQuery', () => {
    it('should accept default query parameters', () => {
      const result = validateCustomerQuery({})
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })

    it('should accept valid custom page', () => {
      const result = validateCustomerQuery({ page: 5 })
      expect(result).toEqual({ page: 5, pageSize: 10 })
    })

    it('should accept valid custom pageSize', () => {
      const result = validateCustomerQuery({ pageSize: 25 })
      expect(result).toEqual({ page: 1, pageSize: 25 })
    })

    it('should accept valid custom page and pageSize', () => {
      const result = validateCustomerQuery({ page: 3, pageSize: 50 })
      expect(result).toEqual({ page: 3, pageSize: 50 })
    })

    it('should accept pageSize at maximum (100)', () => {
      const result = validateCustomerQuery({ pageSize: 100 })
      expect(result).toEqual({ page: 1, pageSize: 100 })
    })

    it('should accept page of 1', () => {
      const result = validateCustomerQuery({ page: 1 })
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })

    // Note: page=0 defaults to 1, so it passes
    it('should accept page of 0 (defaults to 1)', () => {
      const result = validateCustomerQuery({ page: 0 })
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })

    // Note: page=-1 does NOT default (stays -1), so it fails
    it('should reject negative page', () => {
      const result = validateCustomerQuery({ page: -1 })
      expect(result).toBeNull()
    })

    // Note: pageSize=0 defaults to 10, so it passes (not rejected)
    it('should accept pageSize of 0 (defaults to 10)', () => {
      const result = validateCustomerQuery({ pageSize: 0 })
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })

    it('should reject pageSize less than 1 when explicitly validated', () => {
      const result = validateCustomerQuery({ pageSize: -10 })
      expect(result).toBeNull()
    })

    it('should reject pageSize greater than 100', () => {
      const result = validateCustomerQuery({ pageSize: 101 })
      expect(result).toBeNull()
    })

    it('should reject negative pageSize', () => {
      const result = validateCustomerQuery({ pageSize: -5 })
      expect(result).toBeNull()
    })

    it('should accept query with search term', () => {
      const result = validateCustomerQuery({ search: 'test', page: 1, pageSize: 10 })
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })

    it('should accept query with customerType filter', () => {
      const result = validateCustomerQuery({ customerType: 'wholesale' })
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })
  })
})
