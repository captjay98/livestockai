/**
 * Database integration test helpers
 * Uses a separate test database (DATABASE_URL_TEST)
 */
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Transaction } from 'kysely'
import type { Database } from '~/lib/db/types'

let testDb: Kysely<Database> | null = null
let currentTrx: Transaction<Database> | null = null

/**
 * Get or create the test database connection
 * Uses DATABASE_URL_TEST environment variable
 */
export function getTestDb(): Kysely<Database> {
  // If we're in a transaction, return the transaction
  if (currentTrx) {
    return currentTrx as unknown as Kysely<Database>
  }

  if (!testDb) {
    const connectionString = process.env.DATABASE_URL_TEST
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL_TEST environment variable is required for integration tests.\n' +
          'Create a test database in Neon and set DATABASE_URL_TEST in .env.test',
      )
    }

    // Use PostgresDialect with pg Pool for full transaction support
    const pool = new Pool({
      connectionString,
      max: 5,
    })

    testDb = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })
  }
  return testDb
}

/**
 * Get the raw database connection (bypasses transaction)
 */
export function getRawTestDb(): Kysely<Database> {
  if (!testDb) {
    getTestDb() // Initialize if needed
  }
  return testDb!
}

/**
 * Close the test database connection
 * NOTE: Only call this at the end of all tests, not after each test
 */
export async function closeTestDb(): Promise<void> {
  currentTrx = null
  if (testDb) {
    await testDb.destroy()
    testDb = null
  }
}

/**
 * Reset the test database connection (for use in afterEach)
 * This clears the transaction but keeps the connection alive
 */
export function resetTestDb(): void {
  currentTrx = null
}

/**
 * Start a transaction for test isolation
 * Call in beforeEach(), pair with rollbackTransaction() in afterEach()
 */
export function startTransaction(): void {
  // We can't actually hold a transaction open across async boundaries with Neon HTTP
  // So we'll use the fast truncate approach instead
}

/**
 * Truncate all tables - optimized single statement
 * Call this in beforeEach() for test isolation
 */
export async function truncateAllTables(): Promise<void> {
  const db = getRawTestDb()
  const { sql } = await import('kysely')

  // Single TRUNCATE CASCADE is fastest - resets all tables at once
  await sql`
    TRUNCATE TABLE 
      listing_views, listing_contact_requests, marketplace_listings,
      invoice_items, water_quality, treatments, vaccinations, weight_samples, 
      egg_records, feed_records, mortality_records, sales, expenses, batches,
      invoices, structures, medication_inventory, feed_inventory, notifications, 
      audit_logs, farm_modules, user_farms, customers, suppliers, user_settings,
      sessions, account, verification, farms, users
    RESTART IDENTITY CASCADE
  `.execute(db)
}

/**
 * Create a test user with Better Auth account
 * Returns userId for use in tests
 */
export async function seedTestUser(
  overrides: {
    email?: string
    name?: string
    role?: 'admin' | 'user'
    password?: string
  } = {},
): Promise<{
  userId: string
  email: string
  name: string
  role: 'admin' | 'user'
}> {
  const db = getTestDb()
  const { hashPassword } = await import('~/lib/db/seeds/helpers')

  const email = overrides.email ?? `test-${Date.now()}@example.com`
  const name = overrides.name ?? 'Test User'
  const role = overrides.role ?? 'user'
  const password = overrides.password ?? 'testpassword123'

  // Create user
  const user = await db
    .insertInto('users')
    .values({
      email,
      name,
      role,
      emailVerified: true,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  // Create account with hashed password (Better Auth pattern)
  const hashedPassword = await hashPassword(password)
  await db
    .insertInto('account')
    .values({
      id: `account-${user.id}`,
      userId: user.id,
      accountId: email,
      providerId: 'credential',
      password: hashedPassword,
    })
    .execute()

  // Create default user settings
  await db
    .insertInto('user_settings')
    .values({
      userId: user.id,
      currencyCode: 'USD',
      currencySymbol: '$',
      currencyDecimals: 2,
      currencySymbolPosition: 'before',
      thousandSeparator: ',',
      decimalSeparator: '.',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      firstDayOfWeek: 1,
      weightUnit: 'kg',
      areaUnit: 'sqm',
      temperatureUnit: 'celsius',
      language: 'en',
      theme: 'system',
      lowStockThresholdPercent: 10,
      mortalityAlertPercent: 5,
      mortalityAlertQuantity: 10,
      notifications: {
        lowStock: true,
        highMortality: true,
        invoiceDue: true,
        batchHarvest: true,
      },
      defaultPaymentTermsDays: 30,
      fiscalYearStartMonth: 1,
      dashboardCards: {
        inventory: true,
        revenue: true,
        expenses: true,
        profit: true,
        mortality: true,
        feed: true,
      },
    })
    .execute()

  return { userId: user.id, email, name, role }
}

/**
 * Create a test farm with user association
 */
export async function seedTestFarm(
  userId: string,
  overrides: {
    name?: string
    type?:
      | 'poultry'
      | 'aquaculture'
      | 'mixed'
      | 'cattle'
      | 'goats'
      | 'sheep'
      | 'bees'
    modules?: Array<
      'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'
    >
  } = {},
): Promise<{ farmId: string }> {
  const db = getTestDb()

  const name = overrides.name ?? 'Test Farm'
  const type = overrides.type ?? 'poultry'
  const modules = overrides.modules ?? ['poultry']

  // Create farm
  const farm = await db
    .insertInto('farms')
    .values({
      name,
      location: 'Test Location',
      type,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  // Associate user with farm as owner
  await db
    .insertInto('user_farms')
    .values({
      userId,
      farmId: farm.id,
      role: 'owner',
    })
    .execute()

  // Create farm modules
  for (const moduleKey of modules) {
    await db
      .insertInto('farm_modules')
      .values({
        farmId: farm.id,
        moduleKey,
        enabled: true,
      })
      .execute()
  }

  return { farmId: farm.id }
}

/**
 * Create a test batch
 */
export async function seedTestBatch(
  farmId: string,
  overrides: {
    livestockType?: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
    species?: string
    initialQuantity?: number
    currentQuantity?: number
    status?: 'active' | 'depleted' | 'sold'
    batchName?: string
    target_weight_g?: number | null
    targetHarvestDate?: Date | null
  } = {},
): Promise<{ batchId: string }> {
  const db = getTestDb()

  const livestockType = overrides.livestockType ?? 'poultry'
  const species = overrides.species ?? 'broiler'
  const initialQuantity = overrides.initialQuantity ?? 100
  const currentQuantity = overrides.currentQuantity ?? initialQuantity
  const status = overrides.status ?? 'active'
  const batchName = overrides.batchName ?? `Test Batch ${Date.now()}`

  const batch = await db
    .insertInto('batches')
    .values({
      farmId,
      batchName,
      livestockType,
      species,
      initialQuantity,
      currentQuantity,
      acquisitionDate: new Date(),
      costPerUnit: '10.00',
      totalCost: (initialQuantity * 10).toFixed(2),
      status,
      target_weight_g: overrides.target_weight_g ?? null,
      targetHarvestDate: overrides.targetHarvestDate ?? null,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return { batchId: batch.id }
}

/**
 * Setup test database (called once before all tests)
 */
export async function setupTestDb(): Promise<void> {
  // Just verify the connection works
  const available = await isTestDbAvailable()
  if (!available) {
    throw new Error('Test database is not available. Run migrations first.')
  }
}

/**
 * Shared test context - seed once per describe block instead of per test
 * Use with beforeAll() for faster tests
 */
export interface TestContext {
  userId: string
  farmId: string
  email: string
}

let sharedContext: TestContext | null = null

/**
 * Get or create shared test context (user + farm)
 * Call in beforeAll() for test suites that need user/farm
 */
export async function getSharedTestContext(): Promise<TestContext> {
  if (!sharedContext) {
    const user = await seedTestUser({ email: 'shared@test.com' })
    const farm = await seedTestFarm(user.userId)
    sharedContext = {
      userId: user.userId,
      farmId: farm.farmId,
      email: user.email,
    }
  }
  return sharedContext
}

/**
 * Clear shared context (call in afterAll)
 */
export function clearSharedContext(): void {
  sharedContext = null
}

/**
 * Quick cleanup - only delete test data, keep user/farm
 * Much faster than full truncate when using shared context
 */
export async function cleanupTestData(): Promise<void> {
  const db = getRawTestDb()
  const { sql } = await import('kysely')

  // Only truncate tables that change between tests, not user/farm
  await sql`
    TRUNCATE TABLE 
      invoice_items, water_quality, treatments, vaccinations, weight_samples, 
      egg_records, feed_records, mortality_records, sales, expenses, batches,
      invoices, structures, medication_inventory, feed_inventory, notifications, 
      audit_logs, customers, suppliers
    RESTART IDENTITY CASCADE
  `.execute(db)
}

/**
 * Check if test database is available
 */
export async function isTestDbAvailable(): Promise<boolean> {
  try {
    const db = getTestDb()
    await db.selectFrom('users').select('id').limit(1).execute()
    return true
  } catch {
    return false
  }
}
