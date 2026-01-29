/**
 * Simple in-memory rate limiter for Extension Worker Mode
 * Tracks queries per user per day with daily reset
 */

interface UserQueries {
  count: number
  date: string // YYYY-MM-DD format
}

// In-memory storage for query counts
const queryTracker = new Map<string, UserQueries>()

const MAX_QUERIES_PER_DAY = 1000

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Check if user has exceeded daily query limit and increment counter
 * @param userId - User ID to check
 * @returns true if within limit, false if exceeded
 */
export function checkAndIncrementQueryLimit(userId: string): boolean {
  const today = getTodayString()
  const userQueries = queryTracker.get(userId)

  // If no record or different date, reset counter
  if (!userQueries || userQueries.date !== today) {
    queryTracker.set(userId, { count: 1, date: today })
    return true
  }

  // Check if limit exceeded
  if (userQueries.count >= MAX_QUERIES_PER_DAY) {
    return false
  }

  // Increment counter
  userQueries.count++
  return true
}

/**
 * Get current query count for user (for debugging/monitoring)
 */
export function getUserQueryCount(userId: string): number {
  const today = getTodayString()
  const userQueries = queryTracker.get(userId)

  if (!userQueries || userQueries.date !== today) {
    return 0
  }

  return userQueries.count
}
