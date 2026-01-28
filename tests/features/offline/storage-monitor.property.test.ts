import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    STORAGE_THRESHOLDS,
    canQueueMutation,
    formatBytes,
    getStorageStatus,
} from '~/lib/storage-monitor'

/**
 * Property Tests for Storage Monitoring
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of storage monitoring utilities
 * that help prevent data loss when storage is near capacity.
 */
describe('Storage Monitor - Property Tests', () => {
    /**
     * Property 15: Storage Threshold Accuracy
     *
     * For any storage percentage, the status SHALL be:
     * - 'ok' when below warning threshold
     * - 'warning' when at or above warning but below critical
     * - 'critical' when at or above critical but below blocked
     * - 'blocked' when at or above blocked threshold
     *
     * **Validates: Requirements 13.1, 13.5**
     */
    describe('Property 15: Storage Threshold Accuracy', () => {
        it('should return "ok" for percentages below warning threshold', () => {
            fc.assert(
                fc.property(
                    fc.integer({
                        min: 0,
                        max: Math.floor(STORAGE_THRESHOLDS.warning) - 1,
                    }),
                    (percentage) => {
                        expect(getStorageStatus(percentage)).toBe('ok')
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should return "warning" for percentages at or above warning but below critical', () => {
            fc.assert(
                fc.property(
                    fc.integer({
                        min: STORAGE_THRESHOLDS.warning,
                        max: STORAGE_THRESHOLDS.critical - 1,
                    }),
                    (percentage) => {
                        expect(getStorageStatus(percentage)).toBe('warning')
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should return "critical" for percentages at or above critical but below blocked', () => {
            fc.assert(
                fc.property(
                    fc.integer({
                        min: STORAGE_THRESHOLDS.critical,
                        max: STORAGE_THRESHOLDS.blocked - 1,
                    }),
                    (percentage) => {
                        expect(getStorageStatus(percentage)).toBe('critical')
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should return "blocked" for percentages at or above blocked threshold', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: STORAGE_THRESHOLDS.blocked, max: 100 }),
                    (percentage) => {
                        expect(getStorageStatus(percentage)).toBe('blocked')
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should have monotonically increasing severity', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }),
                    fc.integer({ min: 0, max: 100 }),
                    (p1, p2) => {
                        const statusOrder = [
                            'ok',
                            'warning',
                            'critical',
                            'blocked',
                        ]
                        const s1 = getStorageStatus(p1)
                        const s2 = getStorageStatus(p2)

                        if (p1 < p2) {
                            expect(statusOrder.indexOf(s1)).toBeLessThanOrEqual(
                                statusOrder.indexOf(s2),
                            )
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    /**
     * Property 16: Storage Block Enforcement
     *
     * For any storage percentage at or above the blocked threshold,
     * canQueueMutation SHALL return false.
     *
     * **Validates: Requirements 13.4**
     */
    describe('Property 16: Storage Block Enforcement', () => {
        it('should allow mutations below blocked threshold', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: STORAGE_THRESHOLDS.blocked - 1 }),
                    (percentage) => {
                        expect(canQueueMutation(percentage)).toBe(true)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should block mutations at or above blocked threshold', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: STORAGE_THRESHOLDS.blocked, max: 100 }),
                    (percentage) => {
                        expect(canQueueMutation(percentage)).toBe(false)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should be consistent with storage status', () => {
            fc.assert(
                fc.property(fc.integer({ min: 0, max: 100 }), (percentage) => {
                    const status = getStorageStatus(percentage)
                    const canQueue = canQueueMutation(percentage)

                    // Can queue if and only if status is not 'blocked'
                    expect(canQueue).toBe(status !== 'blocked')
                }),
                { numRuns: 100 },
            )
        })
    })

    /**
     * Property tests for formatBytes utility
     */
    describe('formatBytes', () => {
        it('should return "0 B" for zero bytes', () => {
            expect(formatBytes(0)).toBe('0 B')
        })

        it('should format bytes correctly for various sizes', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 1024 * 1024 * 1024 }), // Up to 1 GB
                    (bytes) => {
                        const formatted = formatBytes(bytes)

                        // Should contain a number
                        expect(/\d/.test(formatted)).toBe(true)

                        // Should contain a unit
                        expect(/[BKMGT]/.test(formatted)).toBe(true)

                        // Should not be empty
                        expect(formatted.length).toBeGreaterThan(0)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should use appropriate units for size ranges', () => {
            // Bytes
            expect(formatBytes(500)).toMatch(/B$/)

            // Kilobytes
            expect(formatBytes(1024 * 5)).toMatch(/KB$/)

            // Megabytes
            expect(formatBytes(1024 * 1024 * 5)).toMatch(/MB$/)

            // Gigabytes
            expect(formatBytes(1024 * 1024 * 1024 * 5)).toMatch(/GB$/)
        })

        it('should produce reasonable numeric values', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 1024 * 1024 * 100 }), // Up to 100 MB
                    (bytes) => {
                        const formatted = formatBytes(bytes)
                        const numericPart = parseFloat(formatted)

                        // Numeric part should be between 0 and 1024
                        expect(numericPart).toBeGreaterThan(0)
                        expect(numericPart).toBeLessThanOrEqual(1024)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    /**
     * Threshold configuration tests
     */
    describe('Threshold Configuration', () => {
        it('should have thresholds in ascending order', () => {
            expect(STORAGE_THRESHOLDS.warning).toBeLessThan(
                STORAGE_THRESHOLDS.critical,
            )
            expect(STORAGE_THRESHOLDS.critical).toBeLessThan(
                STORAGE_THRESHOLDS.blocked,
            )
        })

        it('should have all thresholds between 0 and 100', () => {
            expect(STORAGE_THRESHOLDS.warning).toBeGreaterThan(0)
            expect(STORAGE_THRESHOLDS.warning).toBeLessThan(100)
            expect(STORAGE_THRESHOLDS.critical).toBeGreaterThan(0)
            expect(STORAGE_THRESHOLDS.critical).toBeLessThan(100)
            expect(STORAGE_THRESHOLDS.blocked).toBeGreaterThan(0)
            expect(STORAGE_THRESHOLDS.blocked).toBeLessThanOrEqual(100)
        })
    })
})
