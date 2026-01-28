import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateInvoiceInput } from '~/features/invoices/server'
import {
    calculateInvoiceTotal,
    calculateItemTotal,
    generateInvoiceNumber,
    validateInvoiceData,
    validateUpdateData,
} from '~/features/invoices/service'

describe('Invoice Service', () => {
    describe('generateInvoiceNumber', () => {
        it('should return first invoice number when no previous invoice', () => {
            const currentYear = new Date().getFullYear()
            const result = generateInvoiceNumber(null)
            expect(result).toBe(`INV-${currentYear}-0001`)
        })

        it('should increment sequence number correctly', () => {
            const currentYear = new Date().getFullYear()
            expect(generateInvoiceNumber(`INV-${currentYear}-0001`)).toBe(
                `INV-${currentYear}-0002`,
            )
            expect(generateInvoiceNumber(`INV-${currentYear}-0009`)).toBe(
                `INV-${currentYear}-0010`,
            )
            expect(generateInvoiceNumber(`INV-${currentYear}-0099`)).toBe(
                `INV-${currentYear}-0100`,
            )
        })

        it('should handle overflow beyond 9999', () => {
            const currentYear = new Date().getFullYear()
            expect(generateInvoiceNumber(`INV-${currentYear}-9999`)).toBe(
                `INV-${currentYear}-10000`,
            )
        })

        it('should reset sequence for new year', () => {
            const lastYear = new Date().getFullYear() - 1
            const result = generateInvoiceNumber(`INV-${lastYear}-9999`)
            const currentYear = new Date().getFullYear()
            expect(result).toBe(`INV-${currentYear}-0001`)
        })

        it('should handle malformed invoice numbers', () => {
            const currentYear = new Date().getFullYear()
            expect(generateInvoiceNumber('INVALID')).toBe(
                `INV-${currentYear}-0001`,
            )
            expect(generateInvoiceNumber('INV-2023-ABC')).toBe(
                `INV-${currentYear}-0001`,
            )
        })
    })

    describe('calculateItemTotal', () => {
        it('should calculate item total as quantity * unitPrice', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 10000 }),
                    fc.integer({ min: 1, max: 100000 }),
                    (quantity, priceCents) => {
                        const unitPrice = priceCents / 100
                        const result = calculateItemTotal(quantity, unitPrice)
                        const expected = (quantity * unitPrice).toFixed(2)
                        expect(result).toBe(expected)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should return 0 for zero or negative quantity', () => {
            expect(calculateItemTotal(0, 10)).toBe('0.00')
            expect(calculateItemTotal(-10, 10)).toBe('0.00')
        })

        it('should return 0 for negative unit price', () => {
            expect(calculateItemTotal(100, -10)).toBe('0.00')
        })

        it('should handle decimal prices correctly', () => {
            expect(calculateItemTotal(10, 5.5)).toBe('55.00')
            expect(calculateItemTotal(3, 99.99)).toBe('299.97')
            expect(calculateItemTotal(7, 7.77)).toBe('54.39')
        })
    })

    describe('calculateInvoiceTotal', () => {
        it('should sum all item totals', () => {
            const items = [
                { quantity: 10, unitPrice: 5.5 },
                { quantity: 5, unitPrice: 10 },
                { quantity: 2, unitPrice: 25 },
            ]
            const result = calculateInvoiceTotal(items)
            // (10 * 5.5) + (5 * 10) + (2 * 25) = 55 + 50 + 50 = 155
            expect(result).toBe('155.00')
        })

        it('should return 0 for empty items array', () => {
            expect(calculateInvoiceTotal([])).toBe('0.00')
        })

        it('should handle property testing for invoice totals', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            quantity: fc.integer({ min: 1, max: 100 }),
                            unitPrice: fc.float({
                                min: Math.fround(0.01),
                                max: 1000,
                                noNaN: true,
                            }),
                        }),
                        { minLength: 1, maxLength: 20 },
                    ),
                    (items) => {
                        const result = calculateInvoiceTotal(items)
                        const expected = items
                            .reduce(
                                (sum, item) =>
                                    sum + item.quantity * item.unitPrice,
                                0,
                            )
                            .toFixed(2)
                        expect(result).toBe(expected)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should use precise decimal arithmetic', () => {
            // This test ensures we avoid floating-point precision issues
            const items = [
                { quantity: 3, unitPrice: 0.1 }, // 0.3 in floating point might be 0.30000000000000004
                { quantity: 1, unitPrice: 0.2 },
            ]
            const result = calculateInvoiceTotal(items)
            expect(result).toBe('0.50')
        })
    })

    describe('validateInvoiceData', () => {
        const validData: CreateInvoiceInput = {
            customerId: 'customer-1',
            farmId: 'farm-1',
            items: [
                {
                    description: 'Broiler chickens',
                    quantity: 100,
                    unitPrice: 5.5,
                },
            ],
        }

        it('should accept valid invoice data', () => {
            const result = validateInvoiceData(validData)
            expect(result).toBeNull()
        })

        it('should reject empty customer ID', () => {
            const result = validateInvoiceData({
                ...validData,
                customerId: '',
            })
            expect(result).toBe('Customer is required')
        })

        it('should reject empty farm ID', () => {
            const result = validateInvoiceData({ ...validData, farmId: '' })
            expect(result).toBe('Farm is required')
        })

        it('should reject empty items array', () => {
            const result = validateInvoiceData({ ...validData, items: [] })
            expect(result).toBe('At least one item is required')
        })

        it('should reject item with empty description', () => {
            const result = validateInvoiceData({
                ...validData,
                items: [{ description: '', quantity: 10, unitPrice: 5.5 }],
            })
            expect(result).toBe('Item 1 description is required')
        })

        it('should reject item with zero quantity', () => {
            const result = validateInvoiceData({
                ...validData,
                items: [{ description: 'Item', quantity: 0, unitPrice: 5.5 }],
            })
            expect(result).toBe('Item 1 quantity must be greater than 0')
        })

        it('should reject item with negative quantity', () => {
            const result = validateInvoiceData({
                ...validData,
                items: [{ description: 'Item', quantity: -10, unitPrice: 5.5 }],
            })
            expect(result).toBe('Item 1 quantity must be greater than 0')
        })

        it('should reject item with negative unit price', () => {
            const result = validateInvoiceData({
                ...validData,
                items: [{ description: 'Item', quantity: 10, unitPrice: -5.5 }],
            })
            expect(result).toBe('Item 1 unit price cannot be negative')
        })

        it('should accept zero unit price (free item)', () => {
            const result = validateInvoiceData({
                ...validData,
                items: [
                    { description: 'Free item', quantity: 10, unitPrice: 0 },
                ],
            })
            expect(result).toBeNull()
        })

        it('should validate multiple items and report first error', () => {
            const result = validateInvoiceData({
                ...validData,
                items: [
                    { description: 'Valid item', quantity: 10, unitPrice: 5.5 },
                    { description: '', quantity: 5, unitPrice: 10 },
                    {
                        description: 'Another invalid',
                        quantity: -5,
                        unitPrice: 10,
                    },
                ],
            })
            // Should report error for item 2 (first invalid item)
            expect(result).toBe('Item 2 description is required')
        })
    })

    describe('validateUpdateData', () => {
        it('should accept valid status', () => {
            expect(validateUpdateData({ status: 'unpaid' })).toBeNull()
            expect(validateUpdateData({ status: 'partial' })).toBeNull()
            expect(validateUpdateData({ status: 'paid' })).toBeNull()
        })

        it('should accept empty update object', () => {
            expect(validateUpdateData({})).toBeNull()
        })

        it('should reject invalid status', () => {
            const result = validateUpdateData({ status: 'invalid' as any })
            expect(result).toBe('Status must be one of: unpaid, partial, paid')
        })
    })
})
