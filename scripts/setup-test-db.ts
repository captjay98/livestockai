#!/usr/bin/env bun

/**
 * Setup script for test database
 * Runs migrations on the test database specified by DATABASE_URL_TEST
 */

import { migrate } from '../app/lib/db/migrate'

async function setupTestDatabase() {
  const testDbUrl = process.env.DATABASE_URL_TEST
  
  if (!testDbUrl) {
    console.error('❌ DATABASE_URL_TEST environment variable not set')
    console.log('Please add DATABASE_URL_TEST to your .env file')
    process.exit(1)
  }

  console.log('🔧 Setting up test database...')
  
  // Temporarily override DATABASE_URL to point to test database
  const originalDbUrl = process.env.DATABASE_URL
  process.env.DATABASE_URL = testDbUrl
  
  try {
    await migrate()
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    process.exit(1)
  } finally {
    // Restore original DATABASE_URL
    process.env.DATABASE_URL = originalDbUrl
  }
}

setupTestDatabase()