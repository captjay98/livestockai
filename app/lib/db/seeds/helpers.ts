/**
 * Seed Helpers - OpenLivestock Manager
 *
 * Shared utilities for creating users in seeders that are compatible with Better Auth.
 *
 * Better Auth Pattern:
 * - User profile data goes in the `users` table (name, email, role, etc.)
 * - Authentication credentials go in the `account` table (password, providerId, etc.)
 * - For email/password auth, providerId='credential' and accountId=email
 *
 * Reference: https://www.better-auth.com/docs/authentication/email-password
 */

import { randomUUID } from 'node:crypto'
import type { Kysely } from 'kysely'
import type { Database } from '../types'

// Use global Web Crypto API (same as Better Auth uses in config.ts)
const webCrypto = globalThis.crypto

/**
 * Parameters for creating a user with authentication
 */
export interface CreateUserParams {
  email: string
  password: string
  name: string
  role?: 'admin' | 'user'
}

/**
 * Information about a created user
 */
export interface CreatedUser {
  userId: string
  email: string
  name: string
  role: string
}

/**
 * Hash a password using PBKDF2 (matching Better Auth's algorithm)
 *
 * Algorithm details:
 * - PBKDF2 with SHA-256
 * - 100,000 iterations (OWASP recommended)
 * - 16-byte random salt
 * - 32-byte hash output
 * - Base64 encoded (salt + hash)
 *
 * @param password - Plain text password to hash
 * @returns Base64-encoded string containing salt and hash (64 characters)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = webCrypto.getRandomValues(new Uint8Array(16))

  // Import password as key material (using Web Crypto API)
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  // Derive hash using PBKDF2
  const hash = await webCrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256, // 32 bytes = 256 bits
  )

  // Combine salt + hash and encode as base64
  const hashArray = new Uint8Array(hash)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Create a user with Better Auth-compatible authentication
 *
 * This function creates both:
 * 1. A `users` table entry (profile data)
 * 2. An `account` table entry (authentication credentials)
 *
 * Better Auth stores passwords in the `account` table with providerId='credential'
 * for email/password authentication.
 *
 * @param db - Kysely database instance
 * @param params - User creation parameters
 * @returns Information about the created user
 * @throws Error if user creation fails
 */
export async function createUserWithAuth(
  db: Kysely<Database>,
  params: CreateUserParams,
): Promise<CreatedUser> {
  const { email, password, name, role = 'user' } = params

  // Hash the password
  const passwordHash = await hashPassword(password)

  // Create user in users table (without password)
  const user = await db
    .insertInto('users')
    .values({
      email,
      name,
      role,
      emailVerified: true, // Mark seeded users as verified
      // Note: password is NOT stored here - it goes in the account table
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  // Create account entry for Better Auth credential provider
  await db
    .insertInto('account')
    .values({
      id: randomUUID(), // Generate unique ID for account
      userId: user.id,
      accountId: email, // For credential provider, accountId = email
      providerId: 'credential', // Better Auth credential provider
      password: passwordHash, // Password stored here, not in users table
    })
    .execute()

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
