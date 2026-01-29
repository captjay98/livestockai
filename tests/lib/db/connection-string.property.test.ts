/**
 * Property tests for database connection string resolution
 *
 * These tests verify the connection string resolution logic works correctly
 * across different environments (Node.js, Cloudflare Workers, etc.)
 *
 * **Validates: Requirements 2.1, 2.2, 4.1**
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fc from 'fast-check'

// We need to test the getConnectionString function in isolation
// Since it's exported, we can test it directly

describe('Connection String Resolution', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  /**
   * Property 1: Connection String Resolution Priority
   *
   * For any valid PostgreSQL connection string in process.env.DATABASE_URL,
   * the getConnectionString() function returns that string.
   *
   * **Validates: Requirements 2.1, 2.2, 4.1**
   */
  describe('Property 1: process.env.DATABASE_URL takes priority', () => {
    it('should return process.env.DATABASE_URL when set', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid-looking PostgreSQL connection strings
          fc.record({
            host: fc.webSegment(),
            port: fc.integer({ min: 1, max: 65535 }),
            database: fc.webSegment(),
            user: fc.webSegment(),
            password: fc.webSegment(),
          }),
          async ({ host, port, database, user, password }) => {
            const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`

            // Set the environment variable
            process.env.DATABASE_URL = connectionString

            // Re-import to get fresh module
            vi.resetModules()
            const { getConnectionString } = await import('~/lib/db')

            const result = await getConnectionString()
            expect(result).toBe(connectionString)
          },
        ),
        { numRuns: 20 },
      )
    })

    it('should handle connection strings with query parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            host: fc.webSegment(),
            database: fc.webSegment(),
            sslmode: fc.constantFrom('require', 'prefer', 'disable'),
          }),
          async ({ host, database, sslmode }) => {
            const connectionString = `postgresql://user:pass@${host}/${database}?sslmode=${sslmode}`

            process.env.DATABASE_URL = connectionString
            vi.resetModules()
            const { getConnectionString } = await import('~/lib/db')

            const result = await getConnectionString()
            expect(result).toBe(connectionString)
          },
        ),
        { numRuns: 10 },
      )
    })
  })

  /**
   * Property 2: Connection String Format Preservation
   *
   * For any connection string set in process.env.DATABASE_URL,
   * the returned string is exactly the same (no modification).
   *
   * **Validates: Requirements 2.1**
   */
  describe('Property 2: Connection string is returned unmodified', () => {
    it('should preserve the exact connection string format', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary strings that look like connection strings
          fc.stringMatching(/^postgresql:\/\/[a-z0-9]+:[a-z0-9]+@[a-z0-9.]+\/[a-z0-9]+$/),
          async (connectionString) => {
            process.env.DATABASE_URL = connectionString
            vi.resetModules()
            const { getConnectionString } = await import('~/lib/db')

            const result = await getConnectionString()
            expect(result).toBe(connectionString)
          },
        ),
        { numRuns: 20 },
      )
    })
  })
})


/**
 * Property 3: Missing Configuration Error
 *
 * When neither Hyperdrive binding nor DATABASE_URL is configured,
 * the getConnectionString() function throws an error with a descriptive message.
 *
 * **Validates: Requirements 4.4**
 */
describe('Property 3: Missing Configuration Error', () => {
  it('should throw descriptive error when DATABASE_URL is not set', async () => {
    // Remove DATABASE_URL from environment
    delete process.env.DATABASE_URL

    vi.resetModules()
    const { getConnectionString } = await import('~/lib/db')

    await expect(getConnectionString()).rejects.toThrow(
      'DATABASE_URL environment variable is not set',
    )
  })

  it('should include setup instructions in error message', async () => {
    delete process.env.DATABASE_URL

    vi.resetModules()
    const { getConnectionString } = await import('~/lib/db')

    await expect(getConnectionString()).rejects.toThrow(/Hyperdrive/)
    await expect(getConnectionString()).rejects.toThrow(/wrangler\.jsonc/)
    await expect(getConnectionString()).rejects.toThrow(/\.dev\.vars/)
  })

  it('should throw when DATABASE_URL is empty string', async () => {
    process.env.DATABASE_URL = ''

    vi.resetModules()
    const { getConnectionString } = await import('~/lib/db')

    await expect(getConnectionString()).rejects.toThrow(
      'DATABASE_URL environment variable is not set',
    )
  })
})
