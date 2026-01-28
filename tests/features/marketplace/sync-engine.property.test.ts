import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
    isCacheStale,
    resolveConflict,
} from '~/features/marketplace/sync-engine'

describe('Sync Engine Property Tests', () => {
    describe('Property 13: Staleness Detection', () => {
        it('should return true IFF lastSyncTime is null OR exceeds 24 hours', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant(null),
                        fc.date({
                            min: new Date('2020-01-01'),
                            max: new Date('2030-01-01'),
                        }),
                    ),
                    (lastSyncTime) => {
                        const now = new Date()
                        const result = isCacheStale(lastSyncTime)

                        if (lastSyncTime === null) {
                            expect(result).toBe(true)
                        } else {
                            const hoursDiff =
                                (now.getTime() - lastSyncTime.getTime()) /
                                (1000 * 60 * 60)
                            expect(result).toBe(hoursDiff > 24)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should handle edge case of exactly 24 hours', () => {
            const exactly24HoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            const result = isCacheStale(exactly24HoursAgo)
            expect(result).toBe(false)
        })
    })

    describe('Property 15: Last-Write-Wins Conflict Resolution', () => {
        it('should return object with more recent updatedAt timestamp', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string(),
                        updatedAt: fc.date({
                            min: new Date('2020-01-01'),
                            max: new Date('2030-01-01'),
                        }),
                        data: fc.string(),
                    }),
                    fc.record({
                        id: fc.string(),
                        updatedAt: fc.date({
                            min: new Date('2020-01-01'),
                            max: new Date('2030-01-01'),
                        }),
                        data: fc.string(),
                    }),
                    (objA, objB) => {
                        const result = resolveConflict(objA, objB)

                        if (
                            objA.updatedAt.getTime() > objB.updatedAt.getTime()
                        ) {
                            expect(result).toBe(objA)
                        } else if (
                            objB.updatedAt.getTime() > objA.updatedAt.getTime()
                        ) {
                            expect(result).toBe(objB)
                        } else {
                            // Equal timestamps - either can be returned (deterministic)
                            expect([objA, objB]).toContain(result)
                        }
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should be symmetric - same winner regardless of argument order', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string(),
                        updatedAt: fc.date({
                            min: new Date('2020-01-01'),
                            max: new Date('2030-01-01'),
                        }),
                        data: fc.string(),
                    }),
                    fc.record({
                        id: fc.string(),
                        updatedAt: fc.date({
                            min: new Date('2020-01-01'),
                            max: new Date('2030-01-01'),
                        }),
                        data: fc.string(),
                    }),
                    (objA, objB) => {
                        const resultAB = resolveConflict(objA, objB)
                        const resultBA = resolveConflict(objB, objA)

                        expect(resultAB).toBe(resultBA)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })
})
