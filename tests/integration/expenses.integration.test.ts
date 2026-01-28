import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
    closeTestDb,
    getTestDb,
    seedTestBatch,
    seedTestFarm,
    seedTestUser,
    truncateAllTables,
} from '../helpers/db-integration'

describe.skipIf(!process.env.DATABASE_URL_TEST)(
    'Expenses Integration Tests',
    () => {
        let userId: string
        let farmId: string
        let batchId: string

        beforeEach(async () => {
            if (!process.env.DATABASE_URL_TEST) return
            await truncateAllTables()

            const user = await seedTestUser({ email: 'farmer@test.com' })
            userId = user.userId

            const farm = await seedTestFarm(userId, {
                name: 'Test Farm',
                type: 'poultry',
                modules: ['poultry'],
            })
            farmId = farm.farmId

            const batch = await seedTestBatch(farmId, {
                livestockType: 'poultry',
                species: 'broiler',
                initialQuantity: 100,
            })
            batchId = batch.batchId
        })

        afterAll(async () => {
            await closeTestDb()
        })

        it('should create expense linked to farm', async () => {
            if (!process.env.DATABASE_URL_TEST) return

            const db = getTestDb()

            const expenseId = await db
                .insertInto('expenses')
                .values({
                    farmId,
                    category: 'utilities',
                    amount: '5000.00',
                    date: new Date(),
                    description: 'Electricity bill',
                    isRecurring: false,
                })
                .returning('id')
                .executeTakeFirst()

            const expense = await db
                .selectFrom('expenses')
                .selectAll()
                .where('id', '=', expenseId!.id)
                .executeTakeFirst()

            expect(expense).toBeDefined()
            expect(expense!.farmId).toBe(farmId)
            expect(expense!.category).toBe('utilities')
            expect(expense!.amount).toBe('5000.00')
            expect(expense!.batchId).toBeNull()
        })

        it('should create expense linked to batch (optional batchId)', async () => {
            if (!process.env.DATABASE_URL_TEST) return

            const db = getTestDb()

            const expenseId = await db
                .insertInto('expenses')
                .values({
                    farmId,
                    batchId,
                    category: 'feed',
                    amount: '2500.00',
                    date: new Date(),
                    description: 'Starter feed',
                    isRecurring: false,
                })
                .returning('id')
                .executeTakeFirst()

            const expense = await db
                .selectFrom('expenses')
                .selectAll()
                .where('id', '=', expenseId!.id)
                .executeTakeFirst()

            expect(expense).toBeDefined()
            expect(expense!.farmId).toBe(farmId)
            expect(expense!.batchId).toBe(batchId)
            expect(expense!.category).toBe('feed')
        })

        it('should validate expense category (must be valid enum)', async () => {
            if (!process.env.DATABASE_URL_TEST) return

            const db = getTestDb()

            await expect(
                db
                    .insertInto('expenses')
                    .values({
                        farmId,
                        category: 'invalid_category' as any,
                        amount: '1000.00',
                        date: new Date(),
                        description: 'Invalid expense',
                        isRecurring: false,
                    })
                    .execute(),
            ).rejects.toThrow()
        })

        it('should handle recurring expense flag', async () => {
            if (!process.env.DATABASE_URL_TEST) return

            const db = getTestDb()

            const expenseId = await db
                .insertInto('expenses')
                .values({
                    farmId,
                    category: 'utilities',
                    amount: '3000.00',
                    date: new Date(),
                    description: 'Monthly electricity',
                    isRecurring: true,
                })
                .returning('id')
                .executeTakeFirst()

            const expense = await db
                .selectFrom('expenses')
                .select(['isRecurring'])
                .where('id', '=', expenseId!.id)
                .executeTakeFirst()

            expect(expense!.isRecurring).toBe(true)
        })

        it('should set batchId to null when batch deleted (ON DELETE SET NULL)', async () => {
            if (!process.env.DATABASE_URL_TEST) return

            const db = getTestDb()

            // Create expense linked to batch
            const expenseId = await db
                .insertInto('expenses')
                .values({
                    farmId,
                    batchId,
                    category: 'medicine',
                    amount: '1500.00',
                    date: new Date(),
                    description: 'Vaccination',
                    isRecurring: false,
                })
                .returning('id')
                .executeTakeFirst()

            // Verify expense is linked to batch
            let expense = await db
                .selectFrom('expenses')
                .select(['batchId'])
                .where('id', '=', expenseId!.id)
                .executeTakeFirst()

            expect(expense!.batchId).toBe(batchId)

            // Delete the batch
            await db.deleteFrom('batches').where('id', '=', batchId).execute()

            // Verify expense batchId is now null
            expense = await db
                .selectFrom('expenses')
                .select(['batchId'])
                .where('id', '=', expenseId!.id)
                .executeTakeFirst()

            expect(expense!.batchId).toBeNull()
        })
    },
)
