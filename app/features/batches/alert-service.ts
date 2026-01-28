/**
 * Alert service for growth deviation notifications
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical'

/**
 * Alert type
 */
export type AlertType = 'growthDeviation' | 'earlyHarvest'

/**
 * Alert result
 */
export interface AlertResult {
    shouldAlert: boolean
    severity: AlertSeverity
    type: AlertType
    recommendation: string
}

/**
 * Determine alert severity based on Performance Index
 *
 * Thresholds:
 * - < 80: Critical (severely behind)
 * - < 90: Warning (behind schedule)
 * - > 110: Info (ahead of schedule, early harvest opportunity)
 *
 * @param performanceIndex - Performance Index percentage
 * @returns Alert result with severity and recommendation
 */
export function determineAlertSeverity(
    performanceIndex: number,
): AlertResult | null {
    // Critical: Severely behind schedule
    if (performanceIndex < 80) {
        return {
            shouldAlert: true,
            severity: 'critical',
            type: 'growthDeviation',
            recommendation: generateRecommendation(
                performanceIndex,
                'critical',
            ),
        }
    }

    // Warning: Behind schedule
    if (performanceIndex < 90) {
        return {
            shouldAlert: true,
            severity: 'warning',
            type: 'growthDeviation',
            recommendation: generateRecommendation(performanceIndex, 'warning'),
        }
    }

    // Info: Ahead of schedule
    if (performanceIndex > 110) {
        return {
            shouldAlert: true,
            severity: 'info',
            type: 'earlyHarvest',
            recommendation: generateRecommendation(performanceIndex, 'info'),
        }
    }

    // No alert needed (95-110 range is on track)
    return null
}

/**
 * Generate actionable recommendation based on deviation
 *
 * @param performanceIndex - Performance Index percentage
 * @param severity - Alert severity level
 * @returns Recommendation message
 */
export function generateRecommendation(
    performanceIndex: number,
    severity: AlertSeverity,
): string {
    const severityRecommendations: Record<
        AlertSeverity,
        (deviation: string) => string
    > = {
        critical: (deviation) =>
            `Batch is ${deviation}% behind expected growth. Immediate action required: Check for disease, increase protein feed, verify water quality, and consult veterinarian.`,
        warning: (deviation) =>
            `Batch is ${deviation}% behind expected growth. Recommended actions: Increase feed quality, check for signs of disease, verify environmental conditions.`,
        info: (deviation) =>
            `Batch is ${deviation}% ahead of expected growth. Consider early harvest opportunity to optimize market timing and reduce feed costs.`,
    }

    const deviation =
        severity === 'info'
            ? (performanceIndex - 100).toFixed(1)
            : Math.abs(100 - performanceIndex).toFixed(1)

    return severityRecommendations[severity](deviation)
}

/**
 * Check if an alert should be created (deduplication)
 *
 * Prevents duplicate alerts within 24 hours for the same batch
 *
 * @param db - Database instance
 * @param batchId - Batch ID
 * @param alertType - Type of alert
 * @returns True if alert should be created
 */
export async function shouldCreateAlert(
    db: Kysely<Database>,
    batchId: string,
    alertType: AlertType,
): Promise<boolean> {
    const { sql } = await import('kysely')

    // Check for recent alerts (within 24 hours)
    const recentAlert = await db
        .selectFrom('notifications')
        .select('id')
        .where('type', '=', alertType)
        .where((eb) => eb(sql`metadata::text`, 'like', `%${batchId}%`))
        .where((eb) =>
            eb(sql`"createdAt"`, '>', sql`NOW() - INTERVAL '24 hours'`),
        )
        .executeTakeFirst()

    // Should create alert if no recent alert exists
    return !recentAlert
}
