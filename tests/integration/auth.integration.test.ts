import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  closeTestDb,
  getTestDb,
  isTestDbAvailable,
  seedTestUser,
  truncateAllTables,
} from '../helpers/db-integration'

describe.skipIf(!process.env.DATABASE_URL_TEST)('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Skip if no test database configured
    if (!process.env.DATABASE_URL_TEST) {
      console.warn(
        '⚠️  Skipping integration tests: DATABASE_URL_TEST not configured',
      )
      return
    }

    const available = await isTestDbAvailable()
    if (!available) {
      console.warn('⚠️  Test database not available')
    }
  })

  beforeEach(async () => {
    if (!process.env.DATABASE_URL_TEST) return
    await truncateAllTables()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should create user with correct fields', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const result = await seedTestUser({
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    })

    expect(result.email).toBe('test@example.com')
    expect(result.userId).toBeDefined()

    // Verify in database
    const db = getTestDb()
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', result.userId)
      .executeTakeFirst()

    expect(user).toBeDefined()
    expect(user!.email).toBe('test@example.com')
    expect(user!.name).toBe('Test User')
    expect(user!.role).toBe('user')
    expect(user!.emailVerified).toBe(true) // seedTestUser sets this to true
  })

  it('should create account record with hashed password (Better Auth pattern)', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const result = await seedTestUser({
      email: 'auth@example.com',
      password: 'mypassword123',
    })

    const db = getTestDb()
    const account = await db
      .selectFrom('account')
      .selectAll()
      .where('userId', '=', result.userId)
      .executeTakeFirst()

    expect(account).toBeDefined()
    expect(account!.providerId).toBe('credential')
    expect(account!.accountId).toBe('auth@example.com')
    // Password should be hashed, not plain text
    expect(account!.password).toBeDefined()
    expect(account!.password).not.toBe('mypassword123')
    expect(account!.password!.length).toBeGreaterThan(50) // Hashed passwords are long
  })

  it('should create user_settings with defaults', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const result = await seedTestUser({ email: 'settings@example.com' })

    const db = getTestDb()
    const settings = await db
      .selectFrom('user_settings')
      .selectAll()
      .where('userId', '=', result.userId)
      .executeTakeFirst()

    expect(settings).toBeDefined()
    // Check actual schema columns
    expect(settings!.currencyCode).toBe('USD')
    expect(settings!.currencySymbol).toBe('$')
    expect(settings!.dateFormat).toBe('YYYY-MM-DD')
    expect(settings!.weightUnit).toBe('kg')
    expect(settings!.temperatureUnit).toBe('celsius')
    expect(settings!.language).toBe('en')
  })

  it('should handle admin role assignment', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const result = await seedTestUser({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    })

    const db = getTestDb()
    const user = await db
      .selectFrom('users')
      .select('role')
      .where('id', '=', result.userId)
      .executeTakeFirst()

    expect(user!.role).toBe('admin')
  })

  it('should fail on duplicate email', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    await seedTestUser({ email: 'duplicate@example.com', name: 'First User' })

    // Second user with same email should fail
    await expect(
      seedTestUser({ email: 'duplicate@example.com', name: 'Second User' }),
    ).rejects.toThrow()
  })

  it('should associate user with farm correctly', async () => {
    if (!process.env.DATABASE_URL_TEST) return

    const { seedTestFarm } = await import('../helpers/db-integration')

    const { userId } = await seedTestUser({ email: 'farmer@example.com' })
    const { farmId } = await seedTestFarm(userId, {
      name: 'Test Farm',
      type: 'poultry',
      modules: ['poultry'],
    })

    const db = getTestDb()

    // Check user_farms association
    const userFarm = await db
      .selectFrom('user_farms')
      .selectAll()
      .where('userId', '=', userId)
      .where('farmId', '=', farmId)
      .executeTakeFirst()

    expect(userFarm).toBeDefined()
    expect(userFarm!.role).toBe('owner')

    // Check farm_modules created
    const modules = await db
      .selectFrom('farm_modules')
      .selectAll()
      .where('farmId', '=', farmId)
      .execute()

    expect(modules.length).toBe(1)
    expect(modules[0].moduleKey).toBe('poultry')
    expect(modules[0].enabled).toBe(true)
  })
})
