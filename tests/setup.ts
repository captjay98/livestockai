/**
 * Test setup file
 * Ensures environment variables are loaded for database tests
 */

import { config } from 'dotenv'

import { afterAll, beforeAll } from 'vitest'

// Load environment variables FIRST, before any other imports
config()

// Verify DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not found in environment variables')
  console.warn('Database tests may fail')
}

// Optimize database connections for tests
process.env.DATABASE_MAX_CONNECTIONS = '5'
process.env.DATABASE_IDLE_TIMEOUT = '1000'

beforeAll(async () => {
  // Dynamic import to ensure env is loaded first
  const { setupTestDb } = await import('./helpers/db-integration')
  await setupTestDb()
})

afterAll(async () => {
  // Dynamic import to ensure env is loaded first
  const { db } = await import('~/lib/db')
  await db.destroy()
})
