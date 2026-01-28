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

let dbSetupAttempted = false

beforeAll(async () => {
    // Only attempt to set up database if DATABASE_URL is available
    // This allows unit tests to run without a database connection
    if (!process.env.DATABASE_URL) {
        console.info('No DATABASE_URL - skipping database setup for unit tests')
        return
    }

    // Dynamic import to ensure env is loaded first
    const { setupTestDb } = await import('./helpers/db-integration')
    await setupTestDb()
    dbSetupAttempted = true
}, 30000) // Increase timeout to 30s for slow connections

afterAll(async () => {
    // Only close database connection if we actually set it up
    if (dbSetupAttempted) {
        // Dynamic import to ensure env is loaded first
        // Note: In test environment (Node.js), we can use the static db export
        const { db } = await import('~/lib/db')
        if (typeof db.destroy === 'function') {
            await db.destroy()
        }
    }
})
