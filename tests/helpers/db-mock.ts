/**
 * Database mock helper for tests
 * Use this instead of importing the real db in tests
 */
import { vi } from 'vitest'

type MockResult = { execute?: Array<unknown>; executeTakeFirst?: unknown }

/**
 * Creates a chainable mock that mimics Kysely's query builder
 * Supports per-table results via tableResults map
 */
export function createMockQueryBuilder(
  defaultResult: Array<unknown> = [],
  tableResults: Record<string, MockResult> = {},
) {
  let currentTable = ''

  const chainable = () => mock
  
  const mock: Record<string, unknown> = {
    selectFrom: vi.fn((table: string) => {
      currentTable = table
      return mock
    }),
    insertInto: vi.fn((table: string) => {
      currentTable = table
      return mock
    }),
    updateTable: vi.fn((table: string) => {
      currentTable = table
      return mock
    }),
    deleteFrom: vi.fn((table: string) => {
      currentTable = table
      return mock
    }),
    select: vi.fn(chainable),
    selectAll: vi.fn(chainable),
    values: vi.fn(chainable),
    set: vi.fn(chainable),
    where: vi.fn(chainable),
    orderBy: vi.fn(chainable),
    limit: vi.fn(chainable),
    offset: vi.fn(chainable),
    leftJoin: vi.fn(chainable),
    innerJoin: vi.fn(chainable),
    returning: vi.fn(chainable),
    execute: vi.fn(() => {
      const result = tableResults[currentTable]?.execute ?? defaultResult
      return Promise.resolve(result)
    }),
    executeTakeFirst: vi.fn(() => {
      const tableData = tableResults[currentTable]
      if (tableData?.executeTakeFirst !== undefined) {
        return Promise.resolve(tableData.executeTakeFirst)
      }
      const arr = tableData?.execute ?? defaultResult
      return Promise.resolve(Array.isArray(arr) ? arr[0] ?? null : null)
    }),
    executeTakeFirstOrThrow: vi.fn(() => {
      const tableData = tableResults[currentTable]
      const arr = tableData?.execute ?? defaultResult
      return Promise.resolve(Array.isArray(arr) ? arr[0] ?? {} : {})
    }),
  }
  return mock
}

/**
 * Creates a mock db instance with optional per-table results
 */
export function createMockDb(
  defaultResult: Array<unknown> = [],
  tableResults: Record<string, MockResult> = {},
) {
  return createMockQueryBuilder(defaultResult, tableResults)
}

/**
 * Helper to create mock module data
 */
export function createMockModule(
  overrides: Partial<{
    id: string
    farmId: string
    moduleKey: string
    enabled: boolean
  }> = {},
) {
  return {
    id: 'test-module-id',
    farmId: 'test-farm-id',
    moduleKey: 'poultry',
    enabled: true,
    createdAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock batch data
 */
export function createMockBatch(
  overrides: Partial<{
    id: string
    farmId: string
    livestockType: string
    status: string
  }> = {},
) {
  return {
    id: 'test-batch-id',
    farmId: 'test-farm-id',
    batchName: 'Test Batch',
    livestockType: 'poultry',
    species: 'broiler',
    status: 'active',
    initialQuantity: 100,
    currentQuantity: 95,
    createdAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock user data
 */
export function createMockUser(overrides: Partial<{
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  emailVerified: boolean
}> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock farm data
 */
export function createMockFarm(overrides: Partial<{
  id: string
  name: string
  location: string
  type: string
}> = {}) {
  return {
    id: 'test-farm-id',
    name: 'Test Farm',
    location: 'Test Location',
    type: 'poultry',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Helper to create mock notification data
 */
export function createMockNotification(overrides: Partial<{
  id: string
  userId: string
  farmId: string | null
  type: string
  title: string
  message: string
  read: boolean
}> = {}) {
  return {
    id: 'test-notification-id',
    userId: 'test-user-id',
    farmId: null,
    type: 'highMortality',
    title: 'Test Notification',
    message: 'Test message',
    read: false,
    actionUrl: null,
    metadata: null,
    createdAt: new Date(),
    ...overrides,
  }
}
