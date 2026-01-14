import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createUserWithAuth } from '~/lib/db/seeds/helpers'
import { db } from '~/lib/db'

describe('Development Seeder Property Tests', () => {
  beforeEach(async () => {
    // Clean up before each test - respect FK constraints (reverse order of creation)
    await db.deleteFrom('user_farms').execute()
    await db.deleteFrom('farms').execute()
    await db.deleteFrom('user_settings').execute()
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
  })

  afterEach(async () => {
    // Clean up after each test - respect FK constraints (reverse order of creation)
    await db.deleteFrom('user_farms').execute()
    await db.deleteFrom('farms').execute()
    await db.deleteFrom('user_settings').execute()
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
  })

  it(
    'Property 7: Authentication Success (Dev Seeder) - multiple users can be created with authentication',
    async () => {
      // Create admin user (like dev seeder does)
      await createUserWithAuth(db, {
        email: 'admin@openlivestock.local',
        password: 'password123',
        name: 'Farm Administrator',
        role: 'admin',
      })

      // Create demo user (like dev seeder does)
      await createUserWithAuth(db, {
        email: 'demo@openlivestock.local',
        password: 'demo123',
        name: 'Demo User',
        role: 'user',
      })

      // Verify admin user exists
      const adminUser = await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', 'admin@openlivestock.local')
        .executeTakeFirst()

      expect(adminUser).toBeDefined()
      expect(adminUser?.email).toBe('admin@openlivestock.local')
      expect(adminUser?.role).toBe('admin')

      // Verify admin account exists with correct structure
      const adminAccount = await db
        .selectFrom('account')
        .selectAll()
        .where('userId', '=', adminUser!.id)
        .where('providerId', '=', 'credential')
        .executeTakeFirst()

      expect(adminAccount).toBeDefined()
      expect(adminAccount?.providerId).toBe('credential')
      expect(adminAccount?.accountId).toBe('admin@openlivestock.local')
      expect(adminAccount?.password).toBeDefined()
      expect(adminAccount?.password?.length).toBeGreaterThan(0)

      // Verify password is NOT in users table
      expect(adminUser).not.toHaveProperty('password')

      // Verify demo user exists
      const demoUser = await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', 'demo@openlivestock.local')
        .executeTakeFirst()

      expect(demoUser).toBeDefined()
      expect(demoUser?.email).toBe('demo@openlivestock.local')
      expect(demoUser?.role).toBe('user')

      // Verify demo account exists with correct structure
      const demoAccount = await db
        .selectFrom('account')
        .selectAll()
        .where('userId', '=', demoUser!.id)
        .where('providerId', '=', 'credential')
        .executeTakeFirst()

      expect(demoAccount).toBeDefined()
      expect(demoAccount?.providerId).toBe('credential')
      expect(demoAccount?.accountId).toBe('demo@openlivestock.local')
      expect(demoAccount?.password).toBeDefined()
      expect(demoAccount?.password?.length).toBeGreaterThan(0)

      // Verify password is NOT in users table
      expect(demoUser).not.toHaveProperty('password')
    },
    { timeout: 30000 },
  )
})
