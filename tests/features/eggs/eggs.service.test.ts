import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { CreateEggRecordInput } from '~/features/eggs/server'
import {
    buildEggSummary,
    calculateBreakageRate,
    calculateEggTotals,
    calculateFertilityRate,
    calculateLayingPercentage,
    calculateProductionRate,
    determineEggGrade,
    validateEggCollectionData,
    validateUpdateData,
} from '~/features/eggs/service'

describe('Eggs Service', () => {
    describe('validateEggCollectionData', () => {
        const validData: CreateEggRecordInput = {
            batchId: 'batch-1',
            date: new Date(),
            quantityCollected: 100,
            quantityBroken: 5,
            quantitySold: 0,
        }

        it('should accept valid data', () => {
            const result = validateEggCollectionData(validData)
            expect(result).toBeNull()
        })

        it('should reject empty batch ID', () => {
            const result = validateEggCollectionData({
                ...validData,
                batchId: '',
            })
            expect(result).toBe('Batch ID is required')
        })

        it('should reject whitespace-only batch ID', () => {
            const result = validateEggCollectionData({
                ...validData,
                batchId: '   ',
            })
            expect(result).toBe('Batch ID is required')
        })

        it('should reject invalid date', () => {
            const result = validateEggCollectionData({
                ...validData,
                date: new Date('invalid') as any,
            })
            expect(result).toBe('Valid collection date is required')
        })

        it('should reject negative quantity collected', () => {
            const result = validateEggCollectionData({
                ...validData,
                quantityCollected: -10,
            })
            expect(result).toBe('Quantity collected cannot be negative')
        })

        it('should reject negative quantity broken', () => {
            const result = validateEggCollectionData({
                ...validData,
                quantityBroken: -5,
            })
            expect(result).toBe('Quantity broken cannot be negative')
        })

        it('should reject negative quantity sold', () => {
            const result = validateEggCollectionData({
                ...validData,
                quantitySold: -10,
            })
            expect(result).toBe('Quantity sold cannot be negative')
        })

        it('should reject when broken + sold exceeds collected', () => {
            const result = validateEggCollectionData({
                ...validData,
                quantityCollected: 10,
                quantityBroken: 5,
                quantitySold: 10,
            })
            expect(result).toBe(
                'Broken and sold quantities cannot exceed collected quantity',
            )
        })

        it('should accept zero collected with zero broken and sold', () => {
            const result = validateEggCollectionData({
                ...validData,
                quantityCollected: 0,
                quantityBroken: 0,
                quantitySold: 0,
            })
            expect(result).toBeNull()
        })

        it('should accept valid data with all quantities', () => {
            const result = validateEggCollectionData({
                batchId: 'batch-1',
                date: new Date(),
                quantityCollected: 100,
                quantityBroken: 3,
                quantitySold: 20,
            })
            expect(result).toBeNull()
        })
    })

    describe('validateUpdateData', () => {
        it('should accept empty update data', () => {
            const result = validateUpdateData({})
            expect(result).toBeNull()
        })

        it('should accept valid update data', () => {
            const result = validateUpdateData({
                date: new Date(),
                quantityCollected: 100,
                quantityBroken: 5,
                quantitySold: 10,
            })
            expect(result).toBeNull()
        })

        it('should reject invalid date', () => {
            const result = validateUpdateData({
                date: new Date('invalid') as any,
            })
            expect(result).toBe('Date must be a valid date')
        })

        it('should reject negative quantity collected', () => {
            const result = validateUpdateData({ quantityCollected: -10 })
            expect(result).toBe('Quantity collected cannot be negative')
        })

        it('should reject negative quantity broken', () => {
            const result = validateUpdateData({ quantityBroken: -5 })
            expect(result).toBe('Quantity broken cannot be negative')
        })

        it('should reject negative quantity sold', () => {
            const result = validateUpdateData({ quantitySold: -10 })
            expect(result).toBe('Quantity sold cannot be negative')
        })

        it('should accept partial updates', () => {
            expect(validateUpdateData({ quantityCollected: 50 })).toBeNull()
            expect(validateUpdateData({ quantityBroken: 2 })).toBeNull()
            expect(validateUpdateData({ quantitySold: 5 })).toBeNull()
            expect(validateUpdateData({ date: new Date() })).toBeNull()
        })
    })

    describe('calculateEggTotals', () => {
        it('should calculate correct totals from records', () => {
            const records = [
                { quantityCollected: 100, quantityBroken: 5, quantitySold: 0 },
                { quantityCollected: 95, quantityBroken: 3, quantitySold: 10 },
            ]
            const totals = calculateEggTotals(records)

            expect(totals.totalCollected).toBe(195)
            expect(totals.totalBroken).toBe(8)
            expect(totals.totalSold).toBe(10)
            expect(totals.currentInventory).toBe(177)
        })

        it('should return zeros for empty records', () => {
            const totals = calculateEggTotals([])

            expect(totals.totalCollected).toBe(0)
            expect(totals.totalBroken).toBe(0)
            expect(totals.totalSold).toBe(0)
            expect(totals.currentInventory).toBe(0)
        })

        it('should handle single record', () => {
            const records = [
                { quantityCollected: 100, quantityBroken: 5, quantitySold: 10 },
            ]
            const totals = calculateEggTotals(records)

            expect(totals.totalCollected).toBe(100)
            expect(totals.totalBroken).toBe(5)
            expect(totals.totalSold).toBe(10)
            expect(totals.currentInventory).toBe(85)
        })

        it('should never return negative inventory', () => {
            const records = [
                { quantityCollected: 10, quantityBroken: 5, quantitySold: 10 },
            ]
            const totals = calculateEggTotals(records)

            expect(totals.currentInventory).toBe(0)
        })

        it('should handle all zeros', () => {
            const records = [
                { quantityCollected: 0, quantityBroken: 0, quantitySold: 0 },
            ]
            const totals = calculateEggTotals(records)

            expect(totals.totalCollected).toBe(0)
            expect(totals.totalBroken).toBe(0)
            expect(totals.totalSold).toBe(0)
            expect(totals.currentInventory).toBe(0)
        })
    })

    describe('buildEggSummary', () => {
        it('should build summary with correct values', () => {
            const records = [
                { quantityCollected: 100, quantityBroken: 5, quantitySold: 0 },
                { quantityCollected: 90, quantityBroken: 2, quantitySold: 5 },
            ]
            const summary = buildEggSummary(records)

            expect(summary.totalCollected).toBe(190)
            expect(summary.totalBroken).toBe(7)
            expect(summary.totalSold).toBe(5)
            expect(summary.recordCount).toBe(2)
        })

        it('should return zeros for empty records', () => {
            const summary = buildEggSummary([])

            expect(summary.totalCollected).toBe(0)
            expect(summary.totalBroken).toBe(0)
            expect(summary.totalSold).toBe(0)
            expect(summary.currentInventory).toBe(0)
            expect(summary.recordCount).toBe(0)
        })
    })

    describe('determineEggGrade', () => {
        it('should return small for small size', () => {
            expect(determineEggGrade('small')).toBe('small')
            expect(determineEggGrade('Small')).toBe('small')
            expect(determineEggGrade('S')).toBe('small')
        })

        it('should return medium for medium size', () => {
            expect(determineEggGrade('medium')).toBe('medium')
            expect(determineEggGrade('Medium')).toBe('medium')
            expect(determineEggGrade('M')).toBe('medium')
        })

        it('should return large for large size', () => {
            expect(determineEggGrade('large')).toBe('large')
            expect(determineEggGrade('Large')).toBe('large')
            expect(determineEggGrade('L')).toBe('large')
        })

        it('should return xl for extra large size', () => {
            expect(determineEggGrade('extra_large')).toBe('xl')
            expect(determineEggGrade('extra large')).toBe('xl')
            expect(determineEggGrade('XL')).toBe('xl')
            expect(determineEggGrade('x-large')).toBe('xl')
        })

        it('should use weight to determine grade when provided', () => {
            // Small eggs: < 53g
            expect(determineEggGrade('medium', 50)).toBe('small')
            expect(determineEggGrade('large', 52)).toBe('small')

            // Medium eggs: 53-62g
            expect(determineEggGrade('small', 55)).toBe('medium')
            expect(determineEggGrade('large', 60)).toBe('medium')

            // Large eggs: 63-72g
            expect(determineEggGrade('small', 65)).toBe('large')
            expect(determineEggGrade('medium', 70)).toBe('large')

            // Extra large eggs: >= 73g
            expect(determineEggGrade('small', 75)).toBe('xl')
            expect(determineEggGrade('medium', 80)).toBe('xl')
        })

        it('should handle edge case weights', () => {
            expect(determineEggGrade('any', 52.9)).toBe('small')
            expect(determineEggGrade('any', 53)).toBe('medium')
            expect(determineEggGrade('any', 62.9)).toBe('medium')
            expect(determineEggGrade('any', 63)).toBe('large')
            expect(determineEggGrade('any', 72.9)).toBe('large')
            expect(determineEggGrade('any', 73)).toBe('xl')
        })
    })

    describe('calculateFertilityRate', () => {
        it('should calculate fertility rate correctly', () => {
            expect(calculateFertilityRate(90, 100)).toBe(90)
            expect(calculateFertilityRate(45, 100)).toBe(45)
            expect(calculateFertilityRate(0, 100)).toBe(0)
        })

        it('should handle decimal results', () => {
            expect(calculateFertilityRate(1, 3)).toBe(33.33)
            expect(calculateFertilityRate(1, 6)).toBe(16.67)
        })

        it('should return 0 for zero total', () => {
            expect(calculateFertilityRate(0, 0)).toBe(0)
            expect(calculateFertilityRate(10, 0)).toBe(0)
        })

        it('should return 0 for negative fertile count', () => {
            expect(calculateFertilityRate(-10, 100)).toBe(0)
        })

        it('should handle 100% fertility', () => {
            expect(calculateFertilityRate(100, 100)).toBe(100)
        })

        it('should clamp to 100 when fertile exceeds total', () => {
            expect(calculateFertilityRate(150, 100)).toBe(100)
        })

        it('should round to 2 decimal places', () => {
            const result = calculateFertilityRate(1, 7)
            expect(result).toBe(14.29)
        })
    })

    describe('calculateLayingPercentage', () => {
        it('should calculate laying percentage correctly', () => {
            expect(calculateLayingPercentage(95, 100)).toBe(95)
            expect(calculateLayingPercentage(48, 100)).toBe(48)
        })

        it('should return 0 for zero flock size', () => {
            expect(calculateLayingPercentage(100, 0)).toBe(0)
        })

        it('should return 0 for negative eggs collected', () => {
            expect(calculateLayingPercentage(-10, 100)).toBe(0)
        })

        it('should handle decimal results', () => {
            expect(calculateLayingPercentage(1, 3)).toBe(33.33)
        })

        it('should handle full flock laying', () => {
            expect(calculateLayingPercentage(100, 100)).toBe(100)
        })

        it('should clamp to 100 when eggs exceed flock', () => {
            expect(calculateLayingPercentage(150, 100)).toBe(100)
        })

        it('should round to 2 decimal places', () => {
            const result = calculateLayingPercentage(1, 7)
            expect(result).toBe(14.29)
        })
    })

    describe('calculateProductionRate', () => {
        it('should calculate production rate correctly', () => {
            expect(calculateProductionRate(1000, 100)).toBe(10)
            expect(calculateProductionRate(500, 100)).toBe(5)
        })

        it('should return 0 for zero flock size', () => {
            expect(calculateProductionRate(100, 0)).toBe(0)
        })

        it('should return 0 for negative eggs', () => {
            expect(calculateProductionRate(-100, 100)).toBe(0)
        })

        it('should handle decimal results', () => {
            expect(calculateProductionRate(1, 3)).toBe(0.33)
        })
    })

    describe('calculateBreakageRate', () => {
        it('should calculate breakage rate correctly', () => {
            expect(calculateBreakageRate(5, 100)).toBe(5)
            expect(calculateBreakageRate(10, 200)).toBe(5)
        })

        it('should return 0 for zero total', () => {
            expect(calculateBreakageRate(0, 0)).toBe(0)
            expect(calculateBreakageRate(10, 0)).toBe(0)
        })

        it('should return 0 for negative broken count', () => {
            expect(calculateBreakageRate(-5, 100)).toBe(0)
        })

        it('should handle 100% breakage', () => {
            expect(calculateBreakageRate(100, 100)).toBe(100)
        })

        it('should clamp to 100 when broken exceeds total', () => {
            expect(calculateBreakageRate(150, 100)).toBe(100)
        })

        it('should handle decimal results', () => {
            expect(calculateBreakageRate(1, 3)).toBe(33.33)
        })
    })

    describe('Property Tests', () => {
        describe('calculateEggTotals - property tests', () => {
            it('should never have negative inventory', () => {
                fc.assert(
                    fc.property(
                        fc.array(
                            fc.record({
                                quantityCollected: fc.nat({ max: 1000 }),
                                quantityBroken: fc.nat({ max: 1000 }),
                                quantitySold: fc.nat({ max: 1000 }),
                            }),
                            { maxLength: 100 },
                        ),
                        (records) => {
                            const totals = calculateEggTotals(records)
                            expect(
                                totals.currentInventory,
                            ).toBeGreaterThanOrEqual(0)
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should equal sum of individual record calculations', () => {
                fc.assert(
                    fc.property(
                        fc.nat({ max: 10000 }),
                        fc.nat({ max: 10000 }),
                        fc.nat({ max: 10000 }),
                        (collected1, broken1, sold1) => {
                            const records1 = [
                                {
                                    quantityCollected: collected1,
                                    quantityBroken: broken1,
                                    quantitySold: sold1,
                                },
                            ]
                            const records2 = [
                                {
                                    quantityCollected: collected1,
                                    quantityBroken: broken1,
                                    quantitySold: sold1,
                                },
                                {
                                    quantityCollected: collected1,
                                    quantityBroken: broken1,
                                    quantitySold: sold1,
                                },
                            ]
                            const totals1 = calculateEggTotals(records1)
                            const totals2 = calculateEggTotals(records2)

                            expect(totals2.totalCollected).toBe(
                                totals1.totalCollected * 2,
                            )
                            expect(totals2.totalBroken).toBe(
                                totals1.totalBroken * 2,
                            )
                            expect(totals2.totalSold).toBe(
                                totals1.totalSold * 2,
                            )
                        },
                    ),
                    { numRuns: 50 },
                )
            })
        })

        describe('calculateFertilityRate - property tests', () => {
            it('should always return value between 0 and 100', () => {
                fc.assert(
                    fc.property(
                        fc.nat({ max: 10000 }),
                        fc.nat({ max: 10000 }),
                        (fertile, total) => {
                            const rate = calculateFertilityRate(fertile, total)
                            if (total > 0) {
                                expect(rate).toBeGreaterThanOrEqual(0)
                                expect(rate).toBeLessThanOrEqual(100)
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })

        describe('calculateLayingPercentage - property tests', () => {
            it('should always return value between 0 and 100', () => {
                fc.assert(
                    fc.property(
                        fc.nat({ max: 10000 }),
                        fc.nat({ max: 10000 }),
                        (eggs, flock) => {
                            const rate = calculateLayingPercentage(eggs, flock)
                            if (flock > 0) {
                                expect(rate).toBeGreaterThanOrEqual(0)
                                expect(rate).toBeLessThanOrEqual(100)
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })

        describe('validateEggCollectionData - property tests', () => {
            it('should always accept valid data', () => {
                fc.assert(
                    fc.property(
                        fc.uuid(),
                        fc.date({
                            min: new Date('2020-01-01'),
                            max: new Date('2030-12-31'),
                        }),
                        fc.nat({ max: 10000 }),
                        fc.nat({ max: 1000 }),
                        fc.nat({ max: 10000 }),
                        (batchId, date, collected, broken, sold) => {
                            // Ensure broken + sold <= collected for valid data
                            // Skip invalid dates (NaN)
                            if (isNaN(date.getTime())) return

                            if (broken + sold <= collected) {
                                const data: CreateEggRecordInput = {
                                    batchId,
                                    date,
                                    quantityCollected: collected,
                                    quantityBroken: broken,
                                    quantitySold: sold,
                                }
                                const result = validateEggCollectionData(data)
                                expect(result).toBeNull()
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })
    })
})
