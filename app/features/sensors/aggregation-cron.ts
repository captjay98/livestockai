/**
 * Sensor aggregation cron job handler for Cloudflare Workers
 *
 * Configure in wrangler.jsonc:
 * {
 *   "triggers": {
 *     "crons": ["0 * * * *"]  // Run every hour
 *   }
 * }
 *
 * This handler aggregates sensor readings into hourly/daily summaries
 * and cleans up old raw data based on retention policy.
 */

import {
  cleanupOldReadings,
  runAggregationForAllSensors,
} from './aggregation-service'
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/** Default retention period for raw readings (days) */
const DEFAULT_RAW_RETENTION_DAYS = 7

interface CronResult {
  success: boolean
  hourlyAggregation: { processed: number; aggregated: number }
  dailyAggregation?: { processed: number; aggregated: number }
  cleanupCount: number
  error?: string
}

/**
 * Main cron handler for sensor data aggregation
 * Should be called hourly via Cloudflare Cron Triggers
 */
export async function handleAggregationCron(
  db: Kysely<Database>,
  options?: {
    rawRetentionDays?: number
    hourlyRetentionDays?: number
  },
): Promise<CronResult> {
  const rawRetentionDays =
    options?.rawRetentionDays ?? DEFAULT_RAW_RETENTION_DAYS

  try {
    const now = new Date()

    // Run hourly aggregation for the previous hour
    const previousHour = new Date(now)
    previousHour.setHours(previousHour.getHours() - 1)

    const hourlyResult = await runAggregationForAllSensors(
      db,
      'hourly',
      previousHour,
    )

    // Run daily aggregation at midnight (first hour of the day)
    let dailyResult: { processed: number; aggregated: number } | undefined
    if (now.getHours() === 0) {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      dailyResult = await runAggregationForAllSensors(db, 'daily', yesterday)
    }

    // Cleanup old raw readings
    const cleanupCount = await cleanupOldReadings(db, rawRetentionDays)

    return {
      success: true,
      hourlyAggregation: hourlyResult,
      dailyAggregation: dailyResult,
      cleanupCount,
    }
  } catch (error) {
    console.error('Aggregation cron failed:', error)
    return {
      success: false,
      hourlyAggregation: { processed: 0, aggregated: 0 },
      cleanupCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Server function to manually trigger aggregation (for testing/admin)
 */
export async function triggerManualAggregation(
  db: Kysely<Database>,
  periodType: 'hourly' | 'daily',
  targetDate: Date,
) {
  return runAggregationForAllSensors(db, periodType, targetDate)
}
