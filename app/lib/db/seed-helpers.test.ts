/**
 * Unit Tests for Seed Helpers
 *
 * Tests the user creation helper functions to ensure they properly create
 * Better Auth-compatible users with correct password hashing and account entries.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createUserWithAuth, hashPassword } from './seed-helpers'
import { db } from './index'

describe('Seed Helpers', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
  })

  describe('hashPassword', () => {
    it('should produce a 64-character base64 string', async () => {
      const hash = await hashPassword('testpassword123')

      expect(hash).toBeTypeOf('string')
      expect(hash).toHaveLength(64)
      // Base64 characters only
      expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('should produce different hashes for the same password (due to random salt)', async () => {
      const password = 'samepassword'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
      expect(hash1).toHaveLength(64)
      expect(hash2).toHaveLength(64)
    })

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1')
      const hash2 = await hashPassword('password2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('createUserWithAuth', () => {
    it('should create both users and account entries', async () => {
      const result = await createUserWithAuth(db, {
        email: 'test@example.com',
        password: 'testpass123',
        name: 'Test User',
        role: 'user',
      })

      // Check returned data
      expect(result.userId).toBeTypeOf('string')
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('Test User')
      expect(result.role).toBe('user')

      // Verify user exists in users table
      const user = await db
        .selectFrom('users')
        .where('id', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')

      // Verify account exists in account table
      const account = await db
        .selectFrom('account')
        .where('userId', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(account).toBeDefined()
      expect(account?.userId).toBe(result.userId)
    })

    it('should set correct providerId and accountId', async () => {
      const result = await createUserWithAuth(db, {
        email: 'provider@example.com',
        password: 'testpass123',
        name: 'Provider Test',
      })

      const account = await db
        .selectFrom('account')
        .where('userId', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(account).toBeDefined()
      expect(account?.providerId).toBe('credential')
      expect(account?.accountId).toBe('provider@example.com')
    })

    it('should store password in account table only', async () => {
      const result = await createUserWithAuth(db, {
        email: 'password@example.com',
        password: 'testpass123',
        name: 'Password Test',
      })

      // Check users table - should NOT have password
      const user = await db
        .selectFrom('users')
        .where('id', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(user).toBeDefined()
      // TypeScript should not even allow accessing password field
      // @ts-expect-error - password field should not exist on users table
      expect(user?.password).toBeUndefined()

      // Check account table - SHOULD have password
      const account = await db
        .selectFrom('account')
        .where('userId', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(account).toBeDefined()
      expect(account?.password).toBeTypeOf('string')
      expect(account?.password).toHaveLength(64)
    })

    it('should default role to "user" if not specified', async () => {
      const result = await createUserWithAuth(db, {
        email: 'defaultrole@example.com',
        password: 'testpass123',
        name: 'Default Role Test',
        // role not specified
      })

      expect(result.role).toBe('user')

      const user = await db
        .selectFrom('users')
        .where('id', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(user?.role).toBe('user')
    })

    it('should create admin users when role is specified', async () => {
      const result = await createUserWithAuth(db, {
        email: 'admin@example.com',
        password: 'adminpass123',
        name: 'Admin User',
        role: 'admin',
      })

      expect(result.role).toBe('admin')

      const user = await db
        .selectFrom('users')
        .where('id', '=', result.userId)
        .selectAll()
        .executeTakeFirst()

      expect(user?.role).toBe('admin')
    })
  })
})
