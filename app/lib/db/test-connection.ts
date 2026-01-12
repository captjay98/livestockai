import { db } from './index'

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Simple query to test connection
    await db.selectFrom('users').select('id').limit(1).execute()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  try {
    await db.destroy()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error closing database connection:', error)
  }
}
