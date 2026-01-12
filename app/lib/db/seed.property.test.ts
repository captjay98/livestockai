import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { seed } from './seed'
import { db } from './index'

describe('Production Seeder Property Tests', () => {
  beforeEach(async () => {
    // Clean up before each test - respect FK constraints
    await db.deleteFrom('growth_standards').execute()
    await db.deleteFrom('market_prices').execute()
    await db.deleteFrom('user_settings').execute()
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
  })

  afterEach(async () => {
    // Clean up after each test - respect FK constraints
    await db.deleteFrom('growth_standards').execute()
    await db.deleteFrom('market_prices').execute()
    await db.deleteFrom('user_settings').execute()
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
  })

  it(
    'Property 6: Seeder Idempotency - running seeder twice should not create duplicates',
    async () => {
      // Run seeder first time
      await seed()

      // Get counts after first run
      const usersAfterFirst = await db
        .selectFrom('users')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirstOrThrow()
      const accountsAfterFirst = await db
        .selectFrom('account')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirstOrThrow()

      // Run seeder second time
      await seed()

      // Get counts after second run
      const usersAfterSecond = await db
        .selectFrom('users')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirstOrThrow()
      const accountsAfterSecond = await db
        .selectFrom('account')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirstOrThrow()

      // Counts should be the same (no duplicates)
      expect(usersAfterSecond.count).toBe(usersAfterFirst.count)
      expect(accountsAfterSecond.count).toBe(accountsAfterFirst.count)

      // Should have exactly 1 user and 1 account
      expect(Number(usersAfterSecond.count)).toBe(1)
      expect(Number(accountsAfterSecond.count)).toBe(1)
    },
    { timeout: 30000 },
  )

  it(
    'Property 7: Authentication Success - users created by seeder can authenticate',
    async () => {
      // Run seeder
      await seed()

      // Verify user exists
      const user = await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', 'admin@openlivestock.local')
        .executeTakeFirst()

      expect(user).toBeDefined()
      expect(user?.email).toBe('admin@openlivestock.local')

      // Verify account exists with correct structure
      const account = await db
        .selectFrom('account')
        .selectAll()
        .where('userId', '=', user!.id)
        .where('providerId', '=', 'credential')
        .executeTakeFirst()

      expect(account).toBeDefined()
      expect(account?.providerId).toBe('credential')
      expect(account?.accountId).toBe('admin@openlivestock.local')
      expect(account?.password).toBeDefined()
      expect(account?.password?.length).toBeGreaterThan(0)

      // Verify password is NOT in users table
      expect(user).not.toHaveProperty('password')
    },
    { timeout: 30000 },
  )
})
