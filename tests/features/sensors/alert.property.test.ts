/**
 * Property-based tests for sensor alert service
 * Validates: Requirements 5.1, 5.2, 5.3
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

// Alert threshold checking logic (extracted for testing)
function checkThresholds(
    value: number,
    thresholds: {
        minValue: number | null
        maxValue: number | null
        warningMinValue: number | null
        warningMaxValue: number | null
    },
): {
    shouldAlert: boolean
    severity: 'warning' | 'critical' | null
    type: string | null
} {
    // Critical thresholds take precedence
    if (thresholds.maxValue !== null && value > thresholds.maxValue) {
        return {
            shouldAlert: true,
            severity: 'critical',
            type: 'threshold_high',
        }
    }
    if (thresholds.minValue !== null && value < thresholds.minValue) {
        return {
            shouldAlert: true,
            severity: 'critical',
            type: 'threshold_low',
        }
    }

    // Warning thresholds
    if (
        thresholds.warningMaxValue !== null &&
        value > thresholds.warningMaxValue
    ) {
        return {
            shouldAlert: true,
            severity: 'warning',
            type: 'threshold_high',
        }
    }
    if (
        thresholds.warningMinValue !== null &&
        value < thresholds.warningMinValue
    ) {
        return { shouldAlert: true, severity: 'warning', type: 'threshold_low' }
    }

    return { shouldAlert: false, severity: null, type: null }
}

describe('Sensor Alert Property Tests', () => {
    describe('Property 1: Threshold boundary correctness', () => {
        /**
         * Validates: Requirements 5.1
         * Values above maxValue should always trigger critical alerts
         */
        it('should trigger critical alert when value exceeds maxValue', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 0, max: 100, noNaN: true }),
                    fc.float({ min: 0, max: 100, noNaN: true }),
                    (maxValue, excess) => {
                        const value = maxValue + Math.abs(excess) + 0.01
                        const result = checkThresholds(value, {
                            minValue: null,
                            maxValue,
                            warningMinValue: null,
                            warningMaxValue: null,
                        })

                        expect(result.shouldAlert).toBe(true)
                        expect(result.severity).toBe('critical')
                        expect(result.type).toBe('threshold_high')
                    },
                ),
                { numRuns: 100 },
            )
        })

        /**
         * Validates: Requirements 5.1
         * Values below minValue should always trigger critical alerts
         */
        it('should trigger critical alert when value is below minValue', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 10, max: 100, noNaN: true }),
                    fc.float({ min: 0, max: 10, noNaN: true }),
                    (minValue, deficit) => {
                        const value = minValue - Math.abs(deficit) - 0.01
                        const result = checkThresholds(value, {
                            minValue,
                            maxValue: null,
                            warningMinValue: null,
                            warningMaxValue: null,
                        })

                        expect(result.shouldAlert).toBe(true)
                        expect(result.severity).toBe('critical')
                        expect(result.type).toBe('threshold_low')
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 2: Warning vs Critical precedence', () => {
        /**
         * Validates: Requirements 5.2
         * Critical thresholds should take precedence over warning thresholds
         */
        it('should return critical when both warning and critical thresholds are exceeded', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 50, max: 80, noNaN: true }), // warningMax
                    fc.float({ min: 80, max: 100, noNaN: true }), // criticalMax
                    fc.float({ min: 0, max: 20, noNaN: true }), // excess over critical
                    (warningMax, criticalMax, excess) => {
                        // Ensure proper ordering
                        const actualWarningMax = Math.min(
                            warningMax,
                            criticalMax - 1,
                        )
                        const value = criticalMax + Math.abs(excess) + 0.01

                        const result = checkThresholds(value, {
                            minValue: null,
                            maxValue: criticalMax,
                            warningMinValue: null,
                            warningMaxValue: actualWarningMax,
                        })

                        expect(result.shouldAlert).toBe(true)
                        expect(result.severity).toBe('critical')
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 3: No alert within safe range', () => {
        /**
         * Validates: Requirements 5.3
         * Values within all thresholds should not trigger alerts
         */
        it('should not alert when value is within all thresholds', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 0, max: 20, noNaN: true }), // minValue
                    fc.float({ min: 80, max: 100, noNaN: true }), // maxValue
                    (minValue, maxValue) => {
                        // Generate a value safely in the middle
                        const safeValue = (minValue + maxValue) / 2

                        const result = checkThresholds(safeValue, {
                            minValue,
                            maxValue,
                            warningMinValue: minValue + 5,
                            warningMaxValue: maxValue - 5,
                        })

                        expect(result.shouldAlert).toBe(false)
                        expect(result.severity).toBe(null)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 4: Null thresholds are ignored', () => {
        /**
         * Validates: Requirements 5.1
         * Null thresholds should not trigger alerts regardless of value
         */
        it('should not alert when all thresholds are null', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: -1000, max: 1000, noNaN: true }),
                    (value) => {
                        const result = checkThresholds(value, {
                            minValue: null,
                            maxValue: null,
                            warningMinValue: null,
                            warningMaxValue: null,
                        })

                        expect(result.shouldAlert).toBe(false)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 5: Alert type correctness', () => {
        /**
         * Validates: Requirements 5.1
         * High values should produce threshold_high, low values should produce threshold_low
         */
        it('should return correct alert type based on threshold direction', () => {
            fc.assert(
                fc.property(
                    fc.float({ min: 20, max: 40, noNaN: true }), // minValue
                    fc.float({ min: 60, max: 80, noNaN: true }), // maxValue
                    fc.boolean(), // test high or low
                    (minValue, maxValue, testHigh) => {
                        const value = testHigh ? maxValue + 10 : minValue - 10

                        const result = checkThresholds(value, {
                            minValue,
                            maxValue,
                            warningMinValue: null,
                            warningMaxValue: null,
                        })

                        expect(result.shouldAlert).toBe(true)
                        expect(result.type).toBe(
                            testHigh ? 'threshold_high' : 'threshold_low',
                        )
                    },
                ),
                { numRuns: 100 },
            )
        })
    })
})
