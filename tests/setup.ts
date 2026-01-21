/**
 * Test setup file
 * Ensures environment variables are loaded for database tests
 */

import { config } from 'dotenv'

import { afterAll, beforeAll } from 'vitest'
import { setupTestDb } from './helpers/db-integration'
import { db } from '~/lib/db'

// Load environment variables from .env file
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
  await setupTestDb()
})

afterAll(async () => {
  await db.destroy()
})
