import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

import {
    TEMP_ID_PREFIX,
    addOptimisticRecord,
    createOptimisticContext,
    createRollback,
    generateEntityTempId,
    generateTempId,
    getQueryData,
    isTempId,
    removeById,
    replaceTempId,
    replaceTempIdWithRecord,
    setQueryData,
    updateById,
} from '~/lib/optimistic-utils'
import { createQueryClient } from '~/lib/query-client'

/**
 * Property Tests for Optimistic Update Utilities
 *
 * **Feature: offline-writes-v1**
 *
 * These tests verify the correctness of optimistic update utilities
 * that enable immediate UI feedback during offline mutations.
 */
describe('Optimistic Update Utilities - Property Tests', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = createQueryClient()
    })

    afterEach(() => {
        queryClient.clear()
    })

    // Define test record type with optimistic markers
    interface TestRecord {
        id: string
        name: string
        quantity: number
        amount: number
        _isOptimistic?: boolean
        _tempId?: string
    }

    // Arbitraries for test data generation
    const uuidArb = fc.uuid()
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

    // Record arbitrary for testing array operations
    const recordArb: fc.Arbitrary<TestRecord> = fc.record({
        id: uuidArb,
        name: fc.string({ minLength: 1, maxLength: 100 }),
        quantity: fc.integer({ min: 0, max: 10000 }),
        amount: fc.float({ min: 0, max: 1000000 }),
    })

    // Array of records arbitrary
    const recordsArb = fc.array(recordArb, { minLength: 0, maxLength: 20 })

    /**
     * Property 4: Optimistic Updates
     *
     * For any mutation (create, update, or delete), the local query cache
     * SHALL immediately reflect the change before server confirmation:
     * - Creates add a new record with a temporary ID
     * - Updates modify the existing record in place
     * - Deletes remove the record from the cache
     *
     * **Validates: Requirements 2.1, 2.2, 2.3**
     */
    describe('Property 4: Optimistic Updates', () => {
        describe('generateTempId', () => {
            it('should always generate IDs starting with temp prefix', () => {
                fc.assert(
                    fc.property(fc.constant(null), () => {
                        const tempId = generateTempId()
                        expect(tempId.startsWith(TEMP_ID_PREFIX)).toBe(true)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should generate unique IDs across multiple calls', () => {
                fc.assert(
                    fc.property(fc.integer({ min: 2, max: 100 }), (count) => {
                        const ids = new Set<string>()
                        for (let i = 0; i < count; i++) {
                            ids.add(generateTempId())
                        }
                        // All generated IDs should be unique
                        expect(ids.size).toBe(count)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should generate valid UUID format after prefix', () => {
                fc.assert(
                    fc.property(fc.constant(null), () => {
                        const tempId = generateTempId()
                        const uuidPart = tempId.slice(TEMP_ID_PREFIX.length)
                        // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                        const uuidRegex =
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                        expect(uuidRegex.test(uuidPart)).toBe(true)
                    }),
                    { numRuns: 100 },
                )
            })
        })

        describe('generateEntityTempId', () => {
            it('should include entity type in the generated ID', () => {
                fc.assert(
                    fc.property(entityTypeArb, (entityType) => {
                        const tempId = generateEntityTempId(entityType)
                        expect(
                            tempId.startsWith(
                                `${TEMP_ID_PREFIX}${entityType}-`,
                            ),
                        ).toBe(true)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should generate unique IDs for same entity type', () => {
                fc.assert(
                    fc.property(
                        entityTypeArb,
                        fc.integer({ min: 2, max: 50 }),
                        (entityType, count) => {
                            const ids = new Set<string>()
                            for (let i = 0; i < count; i++) {
                                ids.add(generateEntityTempId(entityType))
                            }
                            expect(ids.size).toBe(count)
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })

        describe('isTempId', () => {
            it('should return true for IDs generated by generateTempId', () => {
                fc.assert(
                    fc.property(fc.constant(null), () => {
                        const tempId = generateTempId()
                        expect(isTempId(tempId)).toBe(true)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should return true for IDs generated by generateEntityTempId', () => {
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
                    fc.property(uuidArb, (uuid) => {
                        // Regular UUIDs should not be identified as temp IDs
                        expect(isTempId(uuid)).toBe(false)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should return false for arbitrary strings not starting with prefix', () => {
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

        describe('addOptimisticRecord (Create)', () => {
            it('should add record with temp ID to empty array', () => {
                fc.assert(
                    fc.property(
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            quantity: fc.integer({ min: 0, max: 10000 }),
                            amount: fc.float({ min: 0, max: 1000000 }),
                        }),
                        (newRecord) => {
                            const tempId = generateTempId()
                            const result = addOptimisticRecord<TestRecord>(
                                undefined,
                                newRecord as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            expect(result).toHaveLength(1)
                            expect(result[0].id).toBe(tempId)
                            expect(result[0].name).toBe(newRecord.name)
                            expect(result[0]._isOptimistic).toBe(true)
                            expect(result[0]._tempId).toBe(tempId)
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should append record to existing array', () => {
                fc.assert(
                    fc.property(
                        recordsArb,
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            quantity: fc.integer({ min: 0, max: 10000 }),
                            amount: fc.float({ min: 0, max: 1000000 }),
                        }),
                        (existingRecords, newRecord) => {
                            const tempId = generateTempId()
                            const result = addOptimisticRecord<TestRecord>(
                                existingRecords,
                                newRecord as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            // Should have one more record
                            expect(result).toHaveLength(
                                existingRecords.length + 1,
                            )

                            // Last record should be the new one
                            const lastRecord = result[result.length - 1]
                            expect(lastRecord.id).toBe(tempId)
                            expect(lastRecord._isOptimistic).toBe(true)

                            // Existing records should be preserved
                            for (let i = 0; i < existingRecords.length; i++) {
                                expect(result[i].id).toBe(existingRecords[i].id)
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should not mutate the original array', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 100 }),
                            quantity: fc.integer({ min: 0, max: 10000 }),
                            amount: fc.float({ min: 0, max: 1000000 }),
                        }),
                        (existingRecords, newRecord) => {
                            const originalLength = existingRecords.length
                            const tempId = generateTempId()

                            addOptimisticRecord<TestRecord>(
                                existingRecords,
                                newRecord as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            // Original array should not be modified
                            expect(existingRecords).toHaveLength(originalLength)
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })

        describe('updateById (Update)', () => {
            it('should update the correct record by ID', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        fc.string({ minLength: 1, maxLength: 100 }),
                        (records, newName) => {
                            // Pick a random record to update
                            const targetIndex = Math.floor(
                                Math.random() * records.length,
                            )
                            const targetId = records[targetIndex].id

                            const result = updateById<TestRecord>(
                                records,
                                targetId,
                                {
                                    name: newName,
                                } as Partial<TestRecord>,
                            )

                            // Find the updated record
                            const updatedRecord = result.find(
                                (r) => r.id === targetId,
                            )
                            expect(updatedRecord).toBeDefined()
                            expect(updatedRecord?.name).toBe(newName)
                            expect(updatedRecord?._isOptimistic).toBe(true)

                            // Other records should be unchanged
                            for (const record of result) {
                                if (record.id !== targetId) {
                                    const original = records.find(
                                        (r) => r.id === record.id,
                                    )
                                    expect(record.name).toBe(original?.name)
                                }
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should preserve array length after update', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 50 }),
                        }),
                        (records, updates) => {
                            const targetId = records[0].id
                            const result = updateById(
                                records,
                                targetId,
                                updates as Partial<TestRecord>,
                            )

                            expect(result).toHaveLength(records.length)
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should return unchanged array if ID not found', () => {
                fc.assert(
                    fc.property(
                        recordsArb,
                        uuidArb,
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 50 }),
                        }),
                        (records, nonExistentId, updates) => {
                            // Ensure the ID doesn't exist in records
                            const existingIds = new Set(
                                records.map((r) => r.id),
                            )
                            if (existingIds.has(nonExistentId)) return // Skip this case

                            const result = updateById(
                                records,
                                nonExistentId,
                                updates as Partial<TestRecord>,
                            )

                            // All records should be unchanged
                            expect(result).toHaveLength(records.length)
                            for (let i = 0; i < records.length; i++) {
                                expect(result[i].id).toBe(records[i].id)
                                expect(result[i].name).toBe(records[i].name)
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should handle empty array', () => {
                fc.assert(
                    fc.property(
                        uuidArb,
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 50 }),
                        }),
                        (id, updates) => {
                            const result = updateById(undefined, id, updates as Partial<TestRecord>)
                            expect(result).toEqual([])
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })

        describe('removeById (Delete)', () => {
            it('should remove the correct record by ID', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        (records) => {
                            // Pick a random record to remove
                            const targetIndex = Math.floor(
                                Math.random() * records.length,
                            )
                            const targetId = records[targetIndex].id

                            const result = removeById(records, targetId)

                            // Should have one less record
                            expect(result).toHaveLength(records.length - 1)

                            // Target record should not exist
                            expect(
                                result.find((r) => r.id === targetId),
                            ).toBeUndefined()

                            // All other records should still exist
                            for (const record of records) {
                                if (record.id !== targetId) {
                                    expect(
                                        result.find((r) => r.id === record.id),
                                    ).toBeDefined()
                                }
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should return unchanged array if ID not found', () => {
                fc.assert(
                    fc.property(
                        recordsArb,
                        uuidArb,
                        (records, nonExistentId) => {
                            // Ensure the ID doesn't exist in records
                            const existingIds = new Set(
                                records.map((r) => r.id),
                            )
                            if (existingIds.has(nonExistentId)) return // Skip this case

                            const result = removeById(records, nonExistentId)

                            expect(result).toHaveLength(records.length)
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should handle empty array', () => {
                fc.assert(
                    fc.property(uuidArb, (id) => {
                        const result = removeById(undefined, id)
                        expect(result).toEqual([])
                    }),
                    { numRuns: 100 },
                )
            })

            it('should not mutate the original array', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        (records) => {
                            const originalLength = records.length
                            const targetId = records[0].id

                            removeById(records, targetId)

                            // Original array should not be modified
                            expect(records).toHaveLength(originalLength)
                            expect(
                                records.find((r) => r.id === targetId),
                            ).toBeDefined()
                        },
                    ),
                    { numRuns: 100 },
                )
            })
        })
    })

    /**
     * Property 5: Rollback on Failure
     *
     * For any mutation that fails after an optimistic update has been applied,
     * the query cache SHALL be restored to its exact state before the optimistic
     * update was applied.
     *
     * **Validates: Requirements 2.4**
     */
    describe('Property 5: Rollback on Failure', () => {
        describe('createOptimisticContext', () => {
            it('should preserve previous data for rollback', () => {
                fc.assert(
                    fc.property(recordsArb, (records) => {
                        const context = createOptimisticContext(records)

                        expect(context.previousData).toEqual(records)
                        expect(context.tempId).toBeUndefined()
                    }),
                    { numRuns: 100 },
                )
            })

            it('should store temp ID when provided', () => {
                fc.assert(
                    fc.property(recordsArb, (records) => {
                        const tempId = generateTempId()
                        const context = createOptimisticContext(records, tempId)

                        expect(context.previousData).toEqual(records)
                        expect(context.tempId).toBe(tempId)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should handle undefined previous data', () => {
                fc.assert(
                    fc.property(fc.constant(null), () => {
                        const context =
                            createOptimisticContext<Array<typeof recordArb>>(
                                undefined,
                            )

                        expect(context.previousData).toBeUndefined()
                    }),
                    { numRuns: 10 },
                )
            })
        })

        describe('createRollback', () => {
            it('should restore cache to previous state on rollback', () => {
                fc.assert(
                    fc.property(
                        recordsArb,
                        recordsArb,
                        (originalRecords, modifiedRecords) => {
                            const queryKey = ['test-rollback']

                            // Set initial data
                            queryClient.setQueryData(queryKey, originalRecords)

                            // Create context with original data
                            const context =
                                createOptimisticContext(originalRecords)

                            // Simulate optimistic update
                            queryClient.setQueryData(queryKey, modifiedRecords)

                            // Verify data was modified
                            expect(queryClient.getQueryData(queryKey)).toEqual(
                                modifiedRecords,
                            )

                            // Create and execute rollback
                            const rollback = createRollback(
                                queryClient,
                                queryKey,
                            )
                            rollback(context)

                            // Verify data was restored
                            expect(queryClient.getQueryData(queryKey)).toEqual(
                                originalRecords,
                            )
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should handle undefined context gracefully', () => {
                fc.assert(
                    fc.property(recordsArb, (records) => {
                        const queryKey = ['test-rollback-undefined']

                        // Set initial data
                        queryClient.setQueryData(queryKey, records)

                        // Create rollback and call with undefined
                        const rollback = createRollback(queryClient, queryKey)
                        rollback(undefined)

                        // Data should remain unchanged
                        expect(queryClient.getQueryData(queryKey)).toEqual(
                            records,
                        )
                    }),
                    { numRuns: 100 },
                )
            })

            it('should restore undefined previous data correctly', () => {
                fc.assert(
                    fc.property(recordsArb, (records) => {
                        const queryKey = ['test-rollback-to-undefined']

                        // Create context with undefined previous data
                        const context =
                            createOptimisticContext<typeof records>(undefined)

                        // Set some data (simulating optimistic update)
                        queryClient.setQueryData(queryKey, records)

                        // Rollback should NOT restore to undefined (only restores if previousData is defined)
                        const rollback = createRollback(queryClient, queryKey)
                        rollback(context)

                        // Data should remain as is since previousData was undefined
                        expect(queryClient.getQueryData(queryKey)).toEqual(
                            records,
                        )
                    }),
                    { numRuns: 100 },
                )
            })
        })

        describe('Query cache operations', () => {
            it('should correctly get and set query data', () => {
                fc.assert(
                    fc.property(recordsArb, (records) => {
                        const queryKey = ['test-get-set']

                        // Set data
                        setQueryData(queryClient, queryKey, records)

                        // Get data
                        const retrieved = getQueryData<typeof records>(
                            queryClient,
                            queryKey,
                        )

                        expect(retrieved).toEqual(records)
                    }),
                    { numRuns: 100 },
                )
            })

            it('should return undefined for non-existent query key', () => {
                fc.assert(
                    fc.property(uuidArb, (uniqueKey) => {
                        const queryKey = ['non-existent', uniqueKey]

                        const retrieved = getQueryData(queryClient, queryKey)

                        expect(retrieved).toBeUndefined()
                    }),
                    { numRuns: 100 },
                )
            })
        })
    })

    /**
     * Property 6: Temporary ID Replacement
     *
     * For any record created with a temporary ID, when the server confirms
     * the creation with a permanent ID, the temporary ID in the cache SHALL
     * be replaced with the server-assigned ID.
     *
     * **Validates: Requirements 2.5, 4.5**
     */
    describe('Property 6: Temporary ID Replacement', () => {
        describe('replaceTempId', () => {
            it('should replace temp ID with server ID', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        uuidArb,
                        (records, serverId) => {
                            // Create a record with temp ID
                            const tempId = generateTempId()
                            const recordsWithTemp = addOptimisticRecord(
                                records,
                                { name: 'Test', quantity: 100, amount: 50 } as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            // Replace temp ID with server ID
                            const result = replaceTempId(
                                recordsWithTemp,
                                tempId,
                                serverId,
                            )

                            // Temp ID should no longer exist
                            expect(
                                result.find((r) => r.id === tempId),
                            ).toBeUndefined()

                            // Server ID should exist
                            const serverRecord = result.find(
                                (r) => r.id === serverId,
                            )
                            expect(serverRecord).toBeDefined()
                            expect(serverRecord?._isOptimistic).toBe(false)
                            expect(serverRecord?._tempId).toBeUndefined()
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should preserve other records when replacing temp ID', () => {
                fc.assert(
                    fc.property(
                        recordsArb.filter((arr) => arr.length > 0),
                        uuidArb,
                        (records, serverId) => {
                            const tempId = generateTempId()
                            const recordsWithTemp = addOptimisticRecord(
                                records,
                                { name: 'New Record', quantity: 1, amount: 1 } as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            const result = replaceTempId(
                                recordsWithTemp,
                                tempId,
                                serverId,
                            )

                            // All original records should still exist
                            for (const original of records) {
                                const found = result.find(
                                    (r) => r.id === original.id,
                                )
                                expect(found).toBeDefined()
                                expect(found?.name).toBe(original.name)
                            }
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should apply additional updates when replacing', () => {
                fc.assert(
                    fc.property(
                        uuidArb,
                        fc.string({ minLength: 1, maxLength: 100 }),
                        (serverId, updatedName) => {
                            const tempId = generateTempId()
                            const records = addOptimisticRecord(
                                [],
                                { name: 'Original', quantity: 100, amount: 50 } as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            const result = replaceTempId(
                                records,
                                tempId,
                                serverId,
                                {
                                    name: updatedName,
                                },
                            )

                            const serverRecord = result.find(
                                (r) => r.id === serverId,
                            )
                            expect(serverRecord?.name).toBe(updatedName)
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should return unchanged array if temp ID not found', () => {
                fc.assert(
                    fc.property(recordsArb, uuidArb, (records, serverId) => {
                        const nonExistentTempId = generateTempId()

                        const result = replaceTempId(
                            records,
                            nonExistentTempId,
                            serverId,
                        )

                        // Array should be unchanged
                        expect(result).toHaveLength(records.length)
                        for (let i = 0; i < records.length; i++) {
                            expect(result[i].id).toBe(records[i].id)
                        }
                    }),
                    { numRuns: 100 },
                )
            })

            it('should handle empty array', () => {
                fc.assert(
                    fc.property(uuidArb, (serverId) => {
                        const tempId = generateTempId()
                        const result = replaceTempId(
                            undefined,
                            tempId,
                            serverId,
                        )

                        expect(result).toEqual([])
                    }),
                    { numRuns: 100 },
                )
            })
        })

        describe('replaceTempIdWithRecord', () => {
            it('should replace temp record with full server record', () => {
                fc.assert(
                    fc.property(
                        recordsArb,
                        recordArb,
                        (existingRecords, serverRecord) => {
                            const tempId = generateTempId()
                            const recordsWithTemp = addOptimisticRecord(
                                existingRecords,
                                { name: 'Temp', quantity: 0, amount: 0 } as unknown as Omit<TestRecord, 'id'>,
                                tempId,
                            )

                            const result = replaceTempIdWithRecord(
                                recordsWithTemp,
                                tempId,
                                serverRecord,
                            )

                            // Temp ID should no longer exist
                            expect(
                                result.find((r) => r.id === tempId),
                            ).toBeUndefined()

                            // Server record should exist with all its data
                            const found = result.find(
                                (r) => r.id === serverRecord.id,
                            )
                            expect(found).toBeDefined()
                            expect(found?.name).toBe(serverRecord.name)
                            expect(found?.quantity).toBe(serverRecord.quantity)
                            expect(found?._isOptimistic).toBe(false)
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should append server record if temp ID not found', () => {
                fc.assert(
                    fc.property(
                        recordsArb,
                        recordArb,
                        (existingRecords, serverRecord) => {
                            const nonExistentTempId = generateTempId()

                            const result = replaceTempIdWithRecord(
                                existingRecords,
                                nonExistentTempId,
                                serverRecord,
                            )

                            // Should have one more record
                            expect(result).toHaveLength(
                                existingRecords.length + 1,
                            )

                            // Server record should be appended
                            expect(
                                result.find((r) => r.id === serverRecord.id),
                            ).toBeDefined()
                        },
                    ),
                    { numRuns: 100 },
                )
            })

            it('should handle undefined records array', () => {
                fc.assert(
                    fc.property(recordArb, (serverRecord) => {
                        const tempId = generateTempId()
                        const result = replaceTempIdWithRecord(
                            undefined,
                            tempId,
                            serverRecord,
                        )

                        expect(result).toHaveLength(1)
                        expect(result[0].id).toBe(serverRecord.id)
                    }),
                    { numRuns: 100 },
                )
            })
        })
    })
})
