/**
 * Property-Based Tests for Seed Helpers
 *
 * These tests verify universal properties that should hold for all valid inputs
 * using fast-check for property-based testing.
 *
 * Feature: fix-seeder-auth
 */

import { afterEach, describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { createUserWithAuth, hashPassword } from './seed-helpers'
import { db } from './index'

describe('Seed Helpers - Property Tests', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
  })

  /**
   * Feature: fix-seeder-auth, Property 1: User Creation Completeness
   * Validates: Requirements 1.1
   *
   * For any valid email/password/name, both users and account entries must exist
   * with matching userId.
   */
  it(
    'Property 1: User creation completeness - creates both users and account entries',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 128 }),
          fc.string({ minLength: 1, maxLength: 255 }),
          fc.constantFrom('admin' as const, 'user' as const),
          async (email, password, name, role) => {
            // Create user
            const result = await createUserWithAuth(db, {
              email,
              password,
              name,
              role,
            })

            // Verify user exists in users table
            const user = await db
              .selectFrom('users')
              .where('id', '=', result.userId)
              .selectAll()
              .executeTakeFirst()

            expect(user).toBeDefined()
            expect(user?.id).toBe(result.userId)

            // Verify account exists in account table
            const account = await db
              .selectFrom('account')
              .where('userId', '=', result.userId)
              .selectAll()
              .executeTakeFirst()

            expect(account).toBeDefined()
            expect(account?.userId).toBe(result.userId)

            // Clean up for next iteration
            await db
              .deleteFrom('account')
              .where('userId', '=', result.userId)
              .execute()
            await db
              .deleteFrom('users')
              .where('id', '=', result.userId)
              .execute()
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 60000 },
  )

  /**
   * Feature: fix-seeder-auth, Property 2: Account Provider Consistency
   * Validates: Requirements 1.2, 1.4
   *
   * For any created account, providerId='credential' and accountId=email.
   */
  it(
    'Property 2: Account provider consistency - correct providerId and accountId',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 128 }),
          fc.string({ minLength: 1, maxLength: 255 }),
          async (email, password, name) => {
            // Create user
            const result = await createUserWithAuth(db, {
              email,
              password,
              name,
            })

            // Verify account has correct providerId and accountId
            const account = await db
              .selectFrom('account')
              .where('userId', '=', result.userId)
              .selectAll()
              .executeTakeFirst()

            expect(account).toBeDefined()
            expect(account?.providerId).toBe('credential')
            expect(account?.accountId).toBe(email)

            // Clean up for next iteration
            await db
              .deleteFrom('account')
              .where('userId', '=', result.userId)
              .execute()
            await db
              .deleteFrom('users')
              .where('id', '=', result.userId)
              .execute()
          },
        ),
        { numRuns: 20 },
      )
    },
    { timeout: 60000 },
  )

  /**
   * Feature: fix-seeder-auth, Property 3: Password Storage Location
   * Validates: Requirements 1.3, 1.5, 6.1
   *
   * For any created user, password is in account table, not users table.
   */
  it(
    'Property 3: Password storage location - password in account table only',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 128 }),
          fc.string({ minLength: 1, maxLength: 255 }),
          async (email, password, name) => {
            // Create user
            const result = await createUserWithAuth(db, {
              email,
              password,
              name,
            })

            // Verify users table does NOT have password
            const user = await db
              .selectFrom('users')
              .where('id', '=', result.userId)
              .selectAll()
              .executeTakeFirst()

            expect(user).toBeDefined()
            // TypeScript should not allow accessing password field
            // @ts-expect-error - password field should not exist on users table
            expect(user?.password).toBeUndefined()

            // Verify account table DOES have password
            const account = await db
              .selectFrom('account')
              .where('userId', '=', result.userId)
              .selectAll()
              .executeTakeFirst()

            expect(account).toBeDefined()
            expect(account?.password).toBeTypeOf('string')
            expect(account?.password).toHaveLength(64)

            // Clean up for next iteration
            await db
              .deleteFrom('account')
              .where('userId', '=', result.userId)
              .execute()
            await db
              .deleteFrom('users')
              .where('id', '=', result.userId)
              .execute()
          },
        ),
        { numRuns: 10 }, // Reduced from 20 due to slow password hashing
      )
    },
    { timeout: 120000 }, // Increased timeout for slow password hashing
  )

  /**
   * Feature: fix-seeder-auth, Property 4: Password Hash Format
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4
   *
   * For any password, hash is base64 with correct length (64 chars).
   */
  it('Property 4: Password hash format - valid base64 with correct length', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 128 }),
        async (password) => {
          const hash = await hashPassword(password)

          // Verify hash format
          expect(hash).toBeTypeOf('string')
          expect(hash).toHaveLength(64)
          // Base64 characters only
          expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/)

          // Verify hash is decodable as base64
          const decoded = atob(hash)
          expect(decoded).toHaveLength(48) // 16 bytes salt + 32 bytes hash
        },
      ),
      { numRuns: 100 },
    )
  })
})
