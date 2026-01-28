/**
 * Pure business logic for monitoring alert operations.
 * All functions are side-effect-free and easily unit testable.
 */

import { differenceInDays, subHours } from 'date-fns'
import type {
    AlertThresholds,
    FeedData,
    GrowthStandardData,
    MonitoringBatch,
    MortalityData,
    VaccinationData,
    WaterQualityData,
    WeightData,
} from './repository'

/**
 * Alert severity levels
 */
export type AlertType = 'critical' | 'warning' | 'info'

/**
 * Alert source categories
 */
export type AlertSource =
    | 'mortality'
    | 'water_quality'
    | 'feed'
    | 'vaccination'
    | 'inventory'
    | 'growth'

/**
 * Alert data structure
 */
export interface BatchAlert {
    id: string
    batchId: string
    species: string
    type: AlertType
    source: AlertSource
    message: string
    timestamp: Date
    value?: number
    metadata?: Record<string, any>
}

/**
 * Batch analysis input data
 */
interface BatchAnalysisInput {
    batch: MonitoringBatch
    recentMortality: MortalityData
    totalMortality: number
    waterQuality: WaterQualityData | null
    vaccinations: Array<VaccinationData>
    feed: FeedData
    latestWeight: WeightData | null
    growthStandards: Array<GrowthStandardData>
    thresholds: AlertThresholds
}

/**
 * Analyze a single batch for health alerts
 * Combines all threshold checks into a comprehensive analysis
 *
 * @param input - All data needed for batch analysis
 * @returns Array of alerts generated from the analysis
 */
export function analyzeBatchHealth(
    input: BatchAnalysisInput,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []
    const {
        batch,
        recentMortality,
        totalMortality,
        waterQuality,
        vaccinations,
        feed,
        latestWeight,
        growthStandards,
        thresholds,
    } = input

    // Skip if batch is empty
    if (batch.currentQuantity === 0) return alerts

    // Run all alert checks
    alerts.push(
        ...checkMortalityAlerts(
            batch,
            recentMortality,
            totalMortality,
            thresholds,
        ),
    )
    alerts.push(...checkWaterQualityAlerts(batch, waterQuality))
    alerts.push(...checkVaccinationAlerts(batch, vaccinations))
    alerts.push(...checkInventoryAlerts(batch))
    alerts.push(...checkFeedAlerts(batch, feed, latestWeight))
    alerts.push(...checkGrowthAlerts(batch, latestWeight, growthStandards))

    return alerts
}

/**
 * Check for mortality-related alerts
 *
 * @param batch - Batch data
 * @param recentMortality - Recent mortality data
 * @param totalMortality - Total mortality count
 * @param thresholds - User-defined alert thresholds
 * @returns Array of mortality alerts
 */
export function checkMortalityAlerts(
    batch: MonitoringBatch,
    recentMortality: MortalityData,
    totalMortality: number,
    thresholds: AlertThresholds,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []
    const deadInLast24h = Number(recentMortality.runTotal ?? 0)
    const dailyMortalityRate =
        batch.currentQuantity > 0 ? deadInLast24h / batch.currentQuantity : 0
    const totalRate =
        batch.initialQuantity > 0 ? totalMortality / batch.initialQuantity : 0

    // Check sudden death (24h threshold)
    if (
        dailyMortalityRate > thresholds.mortalityAlertPercent / 100 ||
        deadInLast24h > thresholds.mortalityAlertQuantity
    ) {
        alerts.push({
            id: `mortality-sudden-${batch.id}-${Date.now()}`,
            batchId: batch.id,
            species: batch.species,
            type: 'critical',
            source: 'mortality',
            message: `Sudden Death: ${deadInLast24h} deaths in 24h (${(dailyMortalityRate * 100).toFixed(1)}%)`,
            timestamp: new Date(),
            value: dailyMortalityRate * 100,
        })
    }

    // Check cumulative mortality (> 5% total is concerning)
    if (totalRate > 0.05) {
        alerts.push({
            id: `mortality-total-${batch.id}`,
            batchId: batch.id,
            species: batch.species,
            type: totalRate > 0.1 ? 'critical' : 'warning',
            source: 'mortality',
            message: `High Cumulative Mortality: ${(totalRate * 100).toFixed(1)}%`,
            timestamp: new Date(),
            value: totalRate * 100,
        })
    }

    return alerts
}

/**
 * Check for water quality alerts
 *
 * @param batch - Batch data
 * @param waterQuality - Recent water quality record
 * @returns Array of water quality alerts
 */
export function checkWaterQualityAlerts(
    batch: MonitoringBatch,
    waterQuality: WaterQualityData | null,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []

    if (!waterQuality) return alerts

    const ph = parseFloat(waterQuality.ph)
    const ammonia = parseFloat(waterQuality.ammoniaMgL)

    // Check pH level (6.0 - 8.5 is acceptable range)
    if (ph < 6.0 || ph > 8.5) {
        alerts.push({
            id: `ph-${batch.id}-${Date.now()}`,
            batchId: batch.id,
            species: batch.species,
            type: 'warning',
            source: 'water_quality',
            message: `Abnormal pH Level: ${ph.toFixed(1)}`,
            timestamp: waterQuality.date,
            value: ph,
        })
    }

    // Check ammonia level (> 2.0 mg/L is dangerous)
    if (ammonia > 2.0) {
        alerts.push({
            id: `ammonia-${batch.id}-${Date.now()}`,
            batchId: batch.id,
            species: batch.species,
            type: 'critical',
            source: 'water_quality',
            message: `Dangerous Ammonia: ${ammonia.toFixed(2)} mg/L`,
            timestamp: waterQuality.date,
            value: ammonia,
        })
    }

    return alerts
}

/**
 * Check for vaccination-related alerts
 *
 * @param batch - Batch data
 * @param vaccinations - Pending vaccination records
 * @returns Array of vaccination alerts
 */
export function checkVaccinationAlerts(
    batch: MonitoringBatch,
    vaccinations: Array<VaccinationData>,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []
    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    for (const v of vaccinations) {
        if (!v.nextDueDate) continue

        if (v.nextDueDate < now) {
            // Overdue vaccination
            alerts.push({
                id: `vax-overdue-${v.id}`,
                batchId: batch.id,
                species: batch.species,
                type: 'critical',
                source: 'vaccination',
                message: `Overdue Vaccine: ${v.vaccineName}`,
                timestamp: v.nextDueDate,
                metadata: {
                    vaccineName: v.vaccineName,
                    dueDate: v.nextDueDate,
                },
            })
        } else if (v.nextDueDate <= sevenDaysFromNow) {
            // Upcoming vaccination (within 7 days)
            alerts.push({
                id: `vax-upcoming-${v.id}`,
                batchId: batch.id,
                species: batch.species,
                type: 'info',
                source: 'vaccination',
                message: `Upcoming Vaccine: ${v.vaccineName}`,
                timestamp: v.nextDueDate,
                metadata: {
                    vaccineName: v.vaccineName,
                    dueDate: v.nextDueDate,
                },
            })
        }
    }

    return alerts
}

/**
 * Check for inventory/stock level alerts
 *
 * @param batch - Batch data
 * @returns Array of inventory alerts
 */
export function checkInventoryAlerts(
    batch: MonitoringBatch,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []

    const remainingPercentage =
        batch.initialQuantity > 0
            ? (batch.currentQuantity / batch.initialQuantity) * 100
            : 0

    if (remainingPercentage < 10 && remainingPercentage > 0) {
        alerts.push({
            id: `low-stock-${batch.id}`,
            batchId: batch.id,
            species: batch.species,
            type: remainingPercentage < 5 ? 'critical' : 'warning',
            source: 'inventory',
            message: `Low Stock: ${remainingPercentage.toFixed(1)}% remaining`,
            timestamp: new Date(),
            value: remainingPercentage,
        })
    }

    return alerts
}

/**
 * Check for feed conversion ratio (FCR) alerts
 *
 * @param batch - Batch data
 * @param feed - Feed consumption data
 * @param latestWeight - Most recent weight sample
 * @returns Array of feed alerts
 */
export function checkFeedAlerts(
    batch: MonitoringBatch,
    feed: FeedData,
    latestWeight: WeightData | null,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []

    const totalFeedKg = parseFloat(feed.totalKg ?? '0')
    const avgWeightKg = latestWeight
        ? parseFloat(latestWeight.averageWeightKg)
        : 0

    if (totalFeedKg > 0 && avgWeightKg > 0 && batch.currentQuantity > 0) {
        const totalWeightGainKg = avgWeightKg * batch.currentQuantity
        const fcr = totalFeedKg / totalWeightGainKg

        // Industry standards: Broiler FCR ~1.6-1.8, Catfish FCR ~1.2-1.5
        const targetFcr = batch.species.toLowerCase().includes('catfish')
            ? 1.5
            : 1.8

        // Alert if FCR is 20% above target
        if (fcr > targetFcr * 1.2) {
            alerts.push({
                id: `fcr-high-${batch.id}`,
                batchId: batch.id,
                species: batch.species,
                type: fcr > targetFcr * 1.4 ? 'critical' : 'warning',
                source: 'feed',
                message: `High FCR: ${fcr.toFixed(2)} (target: ${targetFcr})`,
                timestamp: new Date(),
                value: fcr,
                metadata: { targetFcr, actualFcr: fcr },
            })
        }
    }

    return alerts
}

/**
 * Check for growth performance alerts
 *
 * @param batch - Batch data
 * @param latestWeight - Most recent weight sample
 * @param growthStandards - Growth benchmark standards
 * @returns Array of growth alerts
 */
export function checkGrowthAlerts(
    batch: MonitoringBatch,
    latestWeight: WeightData | null,
    growthStandards: Array<GrowthStandardData>,
): Array<BatchAlert> {
    const alerts: Array<BatchAlert> = []

    if (growthStandards.length === 0 || !latestWeight) return alerts

    const ageInDays = differenceInDays(new Date(), batch.acquisitionDate)

    // Find the standard for the current age
    const expectedStandard = growthStandards.find((g) => g.day === ageInDays)

    if (expectedStandard) {
        const expectedKg = expectedStandard.expectedWeightG / 1000 // Convert grams to kg
        const actualKg = parseFloat(latestWeight.averageWeightKg)
        const performanceRatio = actualKg / expectedKg

        // Alert if below 85% of expected weight
        if (performanceRatio < 0.85) {
            alerts.push({
                id: `growth-behind-${batch.id}`,
                batchId: batch.id,
                species: batch.species,
                type: performanceRatio < 0.7 ? 'critical' : 'warning',
                source: 'growth',
                message: `Underweight: ${(performanceRatio * 100).toFixed(0)}% of target (${actualKg.toFixed(2)}kg vs ${expectedKg.toFixed(2)}kg)`,
                timestamp: new Date(),
                value: performanceRatio * 100,
                metadata: {
                    expectedKg,
                    actualKg,
                    ageWeeks: Math.floor(ageInDays / 7),
                },
            })
        }
    }

    return alerts
}

/**
 * Calculate the date 24 hours ago for mortality queries
 *
 * @returns Date object representing 24 hours ago
 */
export function getTwentyFourHoursAgo(): Date {
    return subHours(new Date(), 24)
}

/**
 * Calculate date 7 days from now for vaccination lookahead
 *
 * @returns Date object representing 7 days from now
 */
export function getSevenDaysFromNow(): Date {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
}

/**
 * Filter alerts by type
 *
 * @param alerts - Array of alerts to filter
 * @param type - Alert type to filter by
 * @returns Filtered array of alerts
 */
export function filterAlertsByType(
    alerts: Array<BatchAlert>,
    type: AlertType,
): Array<BatchAlert> {
    return alerts.filter((alert) => alert.type === type)
}

/**
 * Filter alerts by source
 *
 * @param alerts - Array of alerts to filter
 * @param source - Alert source to filter by
 * @returns Filtered array of alerts
 */
export function filterAlertsBySource(
    alerts: Array<BatchAlert>,
    source: AlertSource,
): Array<BatchAlert> {
    return alerts.filter((alert) => alert.source === source)
}

/**
 * Sort alerts by severity (critical first)
 *
 * @param alerts - Array of alerts to sort
 * @returns Sorted array of alerts
 */
export function sortAlertsBySeverity(
    alerts: Array<BatchAlert>,
): Array<BatchAlert> {
    const severityOrder: Record<AlertType, number> = {
        critical: 0,
        warning: 1,
        info: 2,
    }

    return [...alerts].sort(
        (a, b) => severityOrder[a.type] - severityOrder[b.type],
    )
}

/**
 * Count alerts by type
 *
 * @param alerts - Array of alerts to count
 * @returns Object with counts by alert type
 */
export function countAlertsByType(
    alerts: Array<BatchAlert>,
): Record<AlertType, number> {
    return {
        critical: alerts.filter((a) => a.type === 'critical').length,
        warning: alerts.filter((a) => a.type === 'warning').length,
        info: alerts.filter((a) => a.type === 'info').length,
    }
}
