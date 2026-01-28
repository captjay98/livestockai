/**
 * Property-based tests for sensor data aggregation
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

// Aggregation logic (extracted for testing)
interface Reading {
    value: number
    recordedAt: Date
}

interface AggregationResult {
    avgValue: number
    minValue: number
    maxValue: number
    readingCount: number
}

function aggregateReadings(readings: Array<Reading>): AggregationResult | null {
    if (readings.length === 0) return null

    const values = readings.map((r) => r.value)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
        avgValue: sum / values.length,
        minValue: Math.min(...values),
        maxValue: Math.max(...values),
        readingCount: values.length,
    }
}

function getPeriodStart(date: Date, periodType: 'hourly' | 'daily'): Date {
    const d = new Date(date)
    if (periodType === 'hourly') {
        d.setMinutes(0, 0, 0)
    } else {
        d.setHours(0, 0, 0, 0)
    }
    return d
}

function getPeriodEnd(date: Date, periodType: 'hourly' | 'daily'): Date {
    const d = new Date(date)
    if (periodType === 'hourly') {
        d.setMinutes(59, 59, 999)
    } else {
        d.setHours(23, 59, 59, 999)
    }
    return d
}

describe('Sensor Aggregation Property Tests', () => {
    describe('Property 1: Aggregation correctness', () => {
        /**
         * Validates: Requirements 6.1
         * Average should equal sum divided by count
         */
        it('should calculate correct average', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.float({
                            min: -1000,
                            max: 1000,
                            noNaN: true,
                            noDefaultInfinity: true,
                        }),
                        { minLength: 1, maxLength: 100 },
                    ),
                    (values) => {
                        const readings = values.map((v) => ({
                            value: v,
                            recordedAt: new Date(),
                        }))
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            const expectedAvg =
                                values.reduce((a, b) => a + b, 0) /
                                values.length
                            expect(result.avgValue).toBeCloseTo(expectedAvg, 10)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        /**
         * Validates: Requirements 6.1
         * Min should be the smallest value
         */
        it('should calculate correct minimum', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.float({
                            min: -1000,
                            max: 1000,
                            noNaN: true,
                            noDefaultInfinity: true,
                        }),
                        { minLength: 1, maxLength: 100 },
                    ),
                    (values) => {
                        const readings = values.map((v) => ({
                            value: v,
                            recordedAt: new Date(),
                        }))
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            expect(result.minValue).toBe(Math.min(...values))
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        /**
         * Validates: Requirements 6.1
         * Max should be the largest value
         */
        it('should calculate correct maximum', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.float({
                            min: -1000,
                            max: 1000,
                            noNaN: true,
                            noDefaultInfinity: true,
                        }),
                        { minLength: 1, maxLength: 100 },
                    ),
                    (values) => {
                        const readings = values.map((v) => ({
                            value: v,
                            recordedAt: new Date(),
                        }))
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            expect(result.maxValue).toBe(Math.max(...values))
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 2: Count invariant', () => {
        /**
         * Validates: Requirements 6.2
         * Reading count should match input array length
         */
        it('should return correct reading count', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.float({
                            min: -1000,
                            max: 1000,
                            noNaN: true,
                            noDefaultInfinity: true,
                        }),
                        { minLength: 1, maxLength: 100 },
                    ),
                    (values) => {
                        const readings = values.map((v) => ({
                            value: v,
                            recordedAt: new Date(),
                        }))
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            expect(result.readingCount).toBe(values.length)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 3: Empty input handling', () => {
        /**
         * Validates: Requirements 6.3
         * Empty arrays should return null
         */
        it('should return null for empty readings', () => {
            const result = aggregateReadings([])
            expect(result).toBeNull()
        })
    })

    describe('Property 4: Min/Max bounds', () => {
        /**
         * Validates: Requirements 6.1
         * Average should always be between min and max
         */
        it('should have average between min and max', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.float({
                            min: -1000,
                            max: 1000,
                            noNaN: true,
                            noDefaultInfinity: true,
                        }),
                        { minLength: 1, maxLength: 100 },
                    ),
                    (values) => {
                        const readings = values.map((v) => ({
                            value: v,
                            recordedAt: new Date(),
                        }))
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            expect(result.avgValue).toBeGreaterThanOrEqual(
                                result.minValue,
                            )
                            expect(result.avgValue).toBeLessThanOrEqual(
                                result.maxValue,
                            )
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        /**
         * Validates: Requirements 6.1
         * Min should be less than or equal to max
         */
        it('should have min <= max', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.float({
                            min: -1000,
                            max: 1000,
                            noNaN: true,
                            noDefaultInfinity: true,
                        }),
                        { minLength: 1, maxLength: 100 },
                    ),
                    (values) => {
                        const readings = values.map((v) => ({
                            value: v,
                            recordedAt: new Date(),
                        }))
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            expect(result.minValue).toBeLessThanOrEqual(
                                result.maxValue,
                            )
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 5: Single value aggregation', () => {
        /**
         * Validates: Requirements 6.1
         * Single value should have avg = min = max
         */
        it('should have avg = min = max for single reading', () => {
            fc.assert(
                fc.property(
                    fc.float({
                        min: -1000,
                        max: 1000,
                        noNaN: true,
                        noDefaultInfinity: true,
                    }),
                    (value) => {
                        const readings = [{ value, recordedAt: new Date() }]
                        const result = aggregateReadings(readings)

                        expect(result).not.toBeNull()
                        if (result) {
                            // Use toBeCloseTo to handle -0 vs 0 edge case
                            expect(result.avgValue).toBeCloseTo(value, 10)
                            expect(result.minValue).toBeCloseTo(value, 10)
                            expect(result.maxValue).toBeCloseTo(value, 10)
                            expect(result.readingCount).toBe(1)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 6: Period boundary correctness', () => {
        // Use integer timestamps to avoid NaN date issues
        const validTimestamp = fc
            .integer({
                min: 1577836800000, // 2020-01-01
                max: 1893456000000, // 2030-01-01
            })
            .map((ts) => new Date(ts))

        /**
         * Validates: Requirements 6.2
         * Period start should be at the beginning of the hour/day
         */
        it('should calculate correct hourly period start', () => {
            fc.assert(
                fc.property(validTimestamp, (date) => {
                    const periodStart = getPeriodStart(date, 'hourly')

                    expect(periodStart.getMinutes()).toBe(0)
                    expect(periodStart.getSeconds()).toBe(0)
                    expect(periodStart.getMilliseconds()).toBe(0)
                    expect(periodStart.getHours()).toBe(date.getHours())
                }),
                { numRuns: 100 },
            )
        })

        it('should calculate correct daily period start', () => {
            fc.assert(
                fc.property(validTimestamp, (date) => {
                    const periodStart = getPeriodStart(date, 'daily')

                    expect(periodStart.getHours()).toBe(0)
                    expect(periodStart.getMinutes()).toBe(0)
                    expect(periodStart.getSeconds()).toBe(0)
                    expect(periodStart.getMilliseconds()).toBe(0)
                    expect(periodStart.getDate()).toBe(date.getDate())
                }),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 7: Period end correctness', () => {
        // Use integer timestamps to avoid NaN date issues
        const validTimestamp = fc
            .integer({
                min: 1577836800000, // 2020-01-01
                max: 1893456000000, // 2030-01-01
            })
            .map((ts) => new Date(ts))

        /**
         * Validates: Requirements 6.2
         * Period end should be at the end of the hour/day
         */
        it('should calculate correct hourly period end', () => {
            fc.assert(
                fc.property(validTimestamp, (date) => {
                    const periodEnd = getPeriodEnd(date, 'hourly')

                    expect(periodEnd.getMinutes()).toBe(59)
                    expect(periodEnd.getSeconds()).toBe(59)
                    expect(periodEnd.getMilliseconds()).toBe(999)
                    expect(periodEnd.getHours()).toBe(date.getHours())
                }),
                { numRuns: 100 },
            )
        })

        it('should calculate correct daily period end', () => {
            fc.assert(
                fc.property(validTimestamp, (date) => {
                    const periodEnd = getPeriodEnd(date, 'daily')

                    expect(periodEnd.getHours()).toBe(23)
                    expect(periodEnd.getMinutes()).toBe(59)
                    expect(periodEnd.getSeconds()).toBe(59)
                    expect(periodEnd.getMilliseconds()).toBe(999)
                    expect(periodEnd.getDate()).toBe(date.getDate())
                }),
                { numRuns: 100 },
            )
        })
    })
})
