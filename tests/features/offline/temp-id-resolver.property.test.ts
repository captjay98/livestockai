import * as fc from 'fast-check'
import { beforeEach, describe, expect, it } from 'vitest'

import {
    extractEntityType,
    findUnresolvedTempIds,
    isTempId,
    resolveAllTempIds,
    tempIdResolver,
} from '~/lib/temp-id-resolver'
import { TEMP_ID_PREFIX, generateEntityTempId } from '~/lib/optimistic-utils'

/**
 * Property Tests for Temp ID Resolution
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of temp ID resolution,
 * ensuring dependent mutations can be updated with real IDs.
 */
describe('Temp ID Resolver - Property Tests', () => {
    beforeEach(async () => {
        await tempIdResolver.clearAll()
    })

    // Arbitraries
    const entityTypeArb = fc.constantFrom(
        'batch',
        'sale',
        'feed',
        'mortality',
        'weight',
        'expense',
        'customer',
        'supplier',
        'invoice',
    )

    const serverIdArb = fc.uuid()

    /**
     * Property 11: Temp ID Resolution Propagation
     *
     * For any temp ID that has been registered with a server ID,
     * resolving that temp ID SHALL return the server ID.
     *
     * **Validates: Requirements 11.1, 11.2**
     */
    describe('Property 11: Temp ID Resolution Propagation', () => {
        it('should resolve registered temp IDs to server IDs', async () => {
            await fc.assert(
                fc.asyncProperty(
                    entityTypeArb,
                    serverIdArb,
                    async (entityType, serverId) => {
                        const tempId = generateEntityTempId(entityType)

                        // Before registration, should return temp ID
                        expect(tempIdResolver.resolve(tempId)).toBe(tempId)

                        // Register mapping
                        await tempIdResolver.register(
                            tempId,
                            serverId,
                            entityType,
                        )

                        // After registration, should return server ID
                        expect(tempIdResolver.resolve(tempId)).toBe(serverId)

                        // Cleanup
                        await tempIdResolver.clear(tempId)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should not modify non-temp IDs during resolution', () => {
            fc.assert(
                fc.property(serverIdArb, (regularId) => {
                    // Regular UUIDs should pass through unchanged
                    expect(tempIdResolver.resolve(regularId)).toBe(regularId)
                }),
                { numRuns: 100 },
            )
        })

        it('should resolve temp IDs in nested objects', async () => {
            await fc.assert(
                fc.asyncProperty(
                    entityTypeArb,
                    serverIdArb,
                    fc.string({ minLength: 1, maxLength: 50 }),
                    async (entityType, serverId, name) => {
                        const tempId = generateEntityTempId(entityType)
                        await tempIdResolver.register(
                            tempId,
                            serverId,
                            entityType,
                        )

                        const obj = {
                            id: tempId,
                            name,
                            nested: {
                                parentId: tempId,
                                items: [{ refId: tempId }],
                            },
                        }

                        const resolved = resolveAllTempIds(obj)

                        expect(resolved.id).toBe(serverId)
                        expect(resolved.nested.parentId).toBe(serverId)
                        expect(resolved.nested.items[0].refId).toBe(serverId)

                        // Cleanup
                        await tempIdResolver.clear(tempId)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    /**
     * Property 12: Temp ID Mapping Completeness
     *
     * For any set of temp IDs registered, the resolver SHALL:
     * - Track all mappings
     * - Report unresolved temp IDs correctly
     * - Clear mappings when requested
     *
     * **Validates: Requirements 11.3, 11.4**
     */
    describe('Property 12: Temp ID Mapping Completeness', () => {
        it('should track all registered mappings', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.tuple(entityTypeArb, serverIdArb), {
                        minLength: 1,
                        maxLength: 10,
                    }),
                    async (pairs) => {
                        const tempIds: Array<string> = []

                        // Register all mappings
                        for (const [entityType, serverId] of pairs) {
                            const tempId = generateEntityTempId(entityType)
                            tempIds.push(tempId)
                            await tempIdResolver.register(
                                tempId,
                                serverId,
                                entityType,
                            )
                        }

                        // All should be resolved
                        for (let i = 0; i < tempIds.length; i++) {
                            expect(tempIdResolver.isResolved(tempIds[i])).toBe(
                                true,
                            )
                            expect(tempIdResolver.resolve(tempIds[i])).toBe(
                                pairs[i][1],
                            )
                        }

                        // Cleanup
                        await tempIdResolver.clearAll()
                    },
                ),
                { numRuns: 50 },
            )
        })

        it('should correctly identify unresolved temp IDs', async () => {
            await fc.assert(
                fc.asyncProperty(
                    entityTypeArb,
                    entityTypeArb,
                    serverIdArb,
                    async (resolvedType, unresolvedType, serverId) => {
                        const resolvedTempId =
                            generateEntityTempId(resolvedType)
                        const unresolvedTempId =
                            generateEntityTempId(unresolvedType)

                        // Register only one
                        await tempIdResolver.register(
                            resolvedTempId,
                            serverId,
                            resolvedType,
                        )

                        const obj = {
                            resolved: resolvedTempId,
                            unresolved: unresolvedTempId,
                        }

                        const unresolved = findUnresolvedTempIds(obj)

                        expect(unresolved).toContain(unresolvedTempId)
                        expect(unresolved).not.toContain(resolvedTempId)

                        // Cleanup
                        await tempIdResolver.clearAll()
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should clear individual mappings correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    entityTypeArb,
                    serverIdArb,
                    async (entityType, serverId) => {
                        const tempId = generateEntityTempId(entityType)

                        await tempIdResolver.register(
                            tempId,
                            serverId,
                            entityType,
                        )
                        expect(tempIdResolver.isResolved(tempId)).toBe(true)

                        await tempIdResolver.clear(tempId)
                        expect(tempIdResolver.isResolved(tempId)).toBe(false)
                        expect(tempIdResolver.resolve(tempId)).toBe(tempId)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should clear all mappings correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.tuple(entityTypeArb, serverIdArb), {
                        minLength: 1,
                        maxLength: 5,
                    }),
                    async (pairs) => {
                        const tempIds: Array<string> = []

                        for (const [entityType, serverId] of pairs) {
                            const tempId = generateEntityTempId(entityType)
                            tempIds.push(tempId)
                            await tempIdResolver.register(
                                tempId,
                                serverId,
                                entityType,
                            )
                        }

                        await tempIdResolver.clearAll()

                        for (const tempId of tempIds) {
                            expect(tempIdResolver.isResolved(tempId)).toBe(
                                false,
                            )
                        }
                    },
                ),
                { numRuns: 50 },
            )
        })
    })

    /**
     * Additional property tests for helper functions
     */
    describe('Helper Functions', () => {
        describe('isTempId', () => {
            it('should return true for generated temp IDs', () => {
                fc.assert(
                    fc.property(entityTypeArb, (entityType) => {
                        const tempId = generateEntityTempId(entityType)
                        expect(isTempId(tempId)).toBe(true)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should return false for regular UUIDs', () => {
                fc.assert(
                    fc.property(serverIdArb, (uuid) => {
                        expect(isTempId(uuid)).toBe(false)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should return false for arbitrary strings without prefix', () => {
                fc.assert(
                    fc.property(
                        fc
                            .string({ minLength: 1, maxLength: 100 })
                            .filter((s) => !s.startsWith(TEMP_ID_PREFIX)),
                        (str) => {
                            expect(isTempId(str)).toBe(false)
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })

        describe('extractEntityType', () => {
            it('should extract entity type from temp IDs', () => {
                fc.assert(
                    fc.property(entityTypeArb, (entityType) => {
                        const tempId = generateEntityTempId(entityType)
                        expect(extractEntityType(tempId)).toBe(entityType)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should return undefined for non-temp IDs', () => {
                fc.assert(
                    fc.property(serverIdArb, (uuid) => {
                        expect(extractEntityType(uuid)).toBeUndefined()
                    }),
                    { numRuns: 100 },
                )
            })
        })
    })
})
