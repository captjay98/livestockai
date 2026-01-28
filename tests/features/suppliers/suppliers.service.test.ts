import { describe, expect, it } from 'vitest'
import type { CreateSupplierInput } from '~/features/suppliers/server'
import type { ValidSupplierType } from '~/features/suppliers/service'
import {
    validateSupplierData,
    validateSupplierQuery,
} from '~/features/suppliers/service'

describe('Suppliers Service', () => {
    const validSupplierTypes: Array<ValidSupplierType> = [
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
    ]

    const createValidSupplier = (
        overrides?: Partial<CreateSupplierInput>,
    ): CreateSupplierInput => ({
        name: 'Test Supplier',
        phone: '+1234567890',
        email: 'test@supplier.com',
        location: '123 Test Street',
        products: ['Product A', 'Product B'],
        supplierType: 'equipment',
        ...overrides,
    })

    describe('validateSupplierData', () => {
        it('should accept valid supplier data', () => {
            const result = validateSupplierData(createValidSupplier())
            expect(result).toBeNull()
        })

        it('should reject empty name', () => {
            const result = validateSupplierData(
                createValidSupplier({ name: '' }),
            )
            expect(result).toBe('Supplier name is required')
        })

        it('should reject whitespace-only name', () => {
            const result = validateSupplierData(
                createValidSupplier({ name: '   ' }),
            )
            expect(result).toBe('Supplier name is required')
        })

        it('should reject name exceeding 255 characters', () => {
            const result = validateSupplierData(
                createValidSupplier({ name: 'a'.repeat(256) }),
            )
            expect(result).toBe(
                'Supplier name must be less than 255 characters',
            )
        })

        it('should accept name at 255 characters', () => {
            const result = validateSupplierData(
                createValidSupplier({ name: 'a'.repeat(255) }),
            )
            expect(result).toBeNull()
        })

        it('should reject empty phone', () => {
            const result = validateSupplierData(
                createValidSupplier({ phone: '' }),
            )
            expect(result).toBe('Phone number is required')
        })

        it('should reject whitespace-only phone', () => {
            const result = validateSupplierData(
                createValidSupplier({ phone: '   ' }),
            )
            expect(result).toBe('Phone number is required')
        })

        it('should reject phone exceeding 50 characters', () => {
            const result = validateSupplierData(
                createValidSupplier({ phone: '1'.repeat(51) }),
            )
            expect(result).toBe('Phone number must be less than 50 characters')
        })

        it('should accept phone at 50 characters', () => {
            const result = validateSupplierData(
                createValidSupplier({ phone: '1'.repeat(50) }),
            )
            expect(result).toBeNull()
        })

        it('should reject email exceeding 255 characters', () => {
            const longEmail = 'a'.repeat(250) + '@test.com'
            const result = validateSupplierData(
                createValidSupplier({ email: longEmail }),
            )
            expect(result).toBe('Email must be less than 255 characters')
        })

        it('should reject invalid email format', () => {
            const result = validateSupplierData(
                createValidSupplier({ email: 'invalid' }),
            )
            expect(result).toBe('Invalid email format')
        })

        it('should reject invalid email without @', () => {
            const result = validateSupplierData(
                createValidSupplier({ email: 'invalidemail.com' }),
            )
            expect(result).toBe('Invalid email format')
        })

        it('should accept valid email', () => {
            const result = validateSupplierData(
                createValidSupplier({ email: 'test@example.com' }),
            )
            expect(result).toBeNull()
        })

        it('should accept email as undefined', () => {
            const result = validateSupplierData(
                createValidSupplier({ email: undefined }),
            )
            expect(result).toBeNull()
        })

        it('should reject location exceeding 500 characters', () => {
            const result = validateSupplierData(
                createValidSupplier({ location: 'a'.repeat(501) }),
            )
            expect(result).toBe('Location must be less than 500 characters')
        })

        it('should accept location at 500 characters', () => {
            const result = validateSupplierData(
                createValidSupplier({ location: 'a'.repeat(500) }),
            )
            expect(result).toBeNull()
        })

        it('should reject empty products array', () => {
            const result = validateSupplierData(
                createValidSupplier({ products: [] }),
            )
            expect(result).toBe('At least one product is required')
        })

        it('should reject products with empty strings', () => {
            const result = validateSupplierData(
                createValidSupplier({ products: ['Product A', ''] }),
            )
            expect(result).toBe('Products must be non-empty strings')
        })

        it('should reject products with whitespace-only strings', () => {
            const result = validateSupplierData(
                createValidSupplier({ products: ['Product A', '   '] }),
            )
            expect(result).toBe('Products must be non-empty strings')
        })

        it('should accept single product', () => {
            const result = validateSupplierData(
                createValidSupplier({ products: ['Single Product'] }),
            )
            expect(result).toBeNull()
        })

        it('should accept many products', () => {
            const result = validateSupplierData(
                createValidSupplier({ products: ['A', 'B', 'C', 'D', 'E'] }),
            )
            expect(result).toBeNull()
        })

        it('should accept all valid supplier types', () => {
            for (const type of validSupplierTypes) {
                const result = validateSupplierData(
                    createValidSupplier({ supplierType: type }),
                )
                expect(result).toBeNull()
            }
        })

        it('should reject invalid supplier type', () => {
            const result = validateSupplierData(
                createValidSupplier({ supplierType: 'invalid_type' as any }),
            )
            expect(result).toContain('Invalid supplier type')
        })

        it('should accept supplierType as null', () => {
            const result = validateSupplierData(
                createValidSupplier({ supplierType: null }),
            )
            expect(result).toBeNull()
        })

        it('should accept supplierType as undefined', () => {
            const result = validateSupplierData(
                createValidSupplier({ supplierType: undefined }),
            )
            expect(result).toBeNull()
        })
    })

    describe('validateSupplierQuery', () => {
        it('should accept default query parameters', () => {
            const result = validateSupplierQuery({})
            expect(result).toEqual({ page: 1, pageSize: 10 })
        })

        it('should accept valid custom page', () => {
            const result = validateSupplierQuery({ page: 5 })
            expect(result).toEqual({ page: 5, pageSize: 10 })
        })

        it('should accept valid custom pageSize', () => {
            const result = validateSupplierQuery({ pageSize: 25 })
            expect(result).toEqual({ page: 1, pageSize: 25 })
        })

        it('should accept valid custom page and pageSize', () => {
            const result = validateSupplierQuery({ page: 3, pageSize: 50 })
            expect(result).toEqual({ page: 3, pageSize: 50 })
        })

        it('should accept pageSize at maximum (100)', () => {
            const result = validateSupplierQuery({ pageSize: 100 })
            expect(result).toEqual({ page: 1, pageSize: 100 })
        })

        // Note: page=0 defaults to 1, so it passes
        it('should accept page of 0 (defaults to 1)', () => {
            const result = validateSupplierQuery({ page: 0 })
            expect(result).toEqual({ page: 1, pageSize: 10 })
        })

        // Note: page=-1 does NOT default (stays -1), so it fails
        it('should reject negative page', () => {
            const result = validateSupplierQuery({ page: -1 })
            expect(result).toBeNull()
        })

        // Note: pageSize=0 defaults to 10, so it passes (not rejected)
        it('should accept pageSize of 0 (defaults to 10)', () => {
            const result = validateSupplierQuery({ pageSize: 0 })
            expect(result).toEqual({ page: 1, pageSize: 10 })
        })

        it('should reject pageSize less than 1 when explicitly validated', () => {
            const result = validateSupplierQuery({ pageSize: -10 })
            expect(result).toBeNull()
        })

        it('should reject pageSize greater than 100', () => {
            const result = validateSupplierQuery({ pageSize: 101 })
            expect(result).toBeNull()
        })

        it('should reject negative pageSize', () => {
            const result = validateSupplierQuery({ pageSize: -5 })
            expect(result).toBeNull()
        })
    })
})
