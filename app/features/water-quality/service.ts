/**
 * Pure business logic for water quality operations.
 * All functions are side-effect-free and easily unit testable.
 */

import { WATER_QUALITY_THRESHOLDS } from './constants'
import type { CreateWaterQualityData, UpdateWaterQualityData } from './types'

/**
 * Validates water quality reading data before creation.
 * Returns validation error message or null if valid.
 *
 * @param data - Reading data to validate
 * @returns Validation error message, or null if data is valid
 *
 * @example
 * ```ts
 * const error = validateReadingData({
 *   batchId: 'batch-1',
 *   date: new Date(),
 *   ph: 7.0,
 *   temperatureCelsius: 27,
 *   dissolvedOxygenMgL: 6,
 *   ammoniaMgL: 0.01
 * })
 * // Returns: null (valid)
 *
 * const invalidError = validateReadingData({ ...data, ph: 3 })
 * // Returns: "pH must be between 6.5 and 9.0"
 * ```
 */
export function validateReadingData(
    data: CreateWaterQualityData,
): string | null {
    if (!data.batchId || data.batchId.trim() === '') {
        return 'Batch ID is required'
    }

    if (isNaN(data.date.getTime())) {
        return 'Valid measurement date is required'
    }

    if (data.ph < 0 || data.ph > 14) {
        return 'pH must be between 0 and 14'
    }

    if (
        data.ph < WATER_QUALITY_THRESHOLDS.ph.min ||
        data.ph > WATER_QUALITY_THRESHOLDS.ph.max
    ) {
        return `pH must be between ${WATER_QUALITY_THRESHOLDS.ph.min} and ${WATER_QUALITY_THRESHOLDS.ph.max}`
    }

    if (data.temperatureCelsius < -10 || data.temperatureCelsius > 50) {
        return 'Temperature must be between -10°C and 50°C'
    }

    if (
        data.temperatureCelsius < WATER_QUALITY_THRESHOLDS.temperature.min ||
        data.temperatureCelsius > WATER_QUALITY_THRESHOLDS.temperature.max
    ) {
        return `Temperature must be between ${WATER_QUALITY_THRESHOLDS.temperature.min}°C and ${WATER_QUALITY_THRESHOLDS.temperature.max}°C`
    }

    if (data.dissolvedOxygenMgL < 0) {
        return 'Dissolved oxygen cannot be negative'
    }

    if (
        data.dissolvedOxygenMgL < WATER_QUALITY_THRESHOLDS.dissolvedOxygen.min
    ) {
        return `Dissolved oxygen must be at least ${WATER_QUALITY_THRESHOLDS.dissolvedOxygen.min} mg/L`
    }

    if (data.ammoniaMgL < 0) {
        return 'Ammonia cannot be negative'
    }

    if (data.ammoniaMgL > WATER_QUALITY_THRESHOLDS.ammonia.max) {
        return `Ammonia must be at most ${WATER_QUALITY_THRESHOLDS.ammonia.max} mg/L`
    }

    return null
}

/**
 * Validates update data for a water quality record.
 * Returns validation error message or null if valid.
 *
 * @param data - Update data to validate
 * @returns Validation error message, or null if data is valid
 */
export function validateUpdateData(
    data: UpdateWaterQualityData,
): string | null {
    if (data.date !== undefined) {
        if (isNaN(data.date.getTime())) {
            return 'Measurement date is invalid'
        }
    }

    if (data.ph !== undefined) {
        if (data.ph < 0 || data.ph > 14) {
            return 'pH must be between 0 and 14'
        }
        if (
            data.ph < WATER_QUALITY_THRESHOLDS.ph.min ||
            data.ph > WATER_QUALITY_THRESHOLDS.ph.max
        ) {
            return `pH must be between ${WATER_QUALITY_THRESHOLDS.ph.min} and ${WATER_QUALITY_THRESHOLDS.ph.max}`
        }
    }

    if (data.temperatureCelsius !== undefined) {
        if (data.temperatureCelsius < -10 || data.temperatureCelsius > 50) {
            return 'Temperature must be between -10°C and 50°C'
        }
        if (
            data.temperatureCelsius <
                WATER_QUALITY_THRESHOLDS.temperature.min ||
            data.temperatureCelsius > WATER_QUALITY_THRESHOLDS.temperature.max
        ) {
            return `Temperature must be between ${WATER_QUALITY_THRESHOLDS.temperature.min}°C and ${WATER_QUALITY_THRESHOLDS.temperature.max}°C`
        }
    }

    if (data.dissolvedOxygenMgL !== undefined) {
        if (data.dissolvedOxygenMgL < 0) {
            return 'Dissolved oxygen cannot be negative'
        }
        if (
            data.dissolvedOxygenMgL <
            WATER_QUALITY_THRESHOLDS.dissolvedOxygen.min
        ) {
            return `Dissolved oxygen must be at least ${WATER_QUALITY_THRESHOLDS.dissolvedOxygen.min} mg/L`
        }
    }

    if (data.ammoniaMgL !== undefined) {
        if (data.ammoniaMgL < 0) {
            return 'Ammonia cannot be negative'
        }
        if (data.ammoniaMgL > WATER_QUALITY_THRESHOLDS.ammonia.max) {
            return `Ammonia must be at most ${WATER_QUALITY_THRESHOLDS.ammonia.max} mg/L`
        }
    }

    return null
}

/**
 * Calculate the average value for a specific parameter across readings.
 *
 * @param readings - Array of water quality readings
 * @param param - The parameter to calculate average for
 * @returns Average value, or null if no readings or invalid parameter
 *
 * @example
 * ```ts
 * const avg = calculateAverageParameter(readings, 'ph')
 * // Returns: 7.25
 * ```
 */
export function calculateAverageParameter(
    readings: Array<{
        ph: string
        temperatureCelsius: string
        dissolvedOxygenMgL: string
        ammoniaMgL: string
    }>,
    param: 'ph' | 'temperatureCelsius' | 'dissolvedOxygenMgL' | 'ammoniaMgL',
): number | null {
    if (readings.length === 0) {
        return null
    }

    const sum = readings.reduce((acc, reading) => {
        const value = parseFloat(reading[param])
        return acc + (isNaN(value) ? 0 : value)
    }, 0)

    return sum / readings.length
}

/**
 * Determine the status of a specific water parameter.
 *
 * @param param - The parameter name
 * @param value - The parameter value
 * @returns Status indicating how the parameter is performing
 *
 * @example
 * ```ts
 * const status = determineParameterStatus('ph', 7.5)
 * // Returns: 'optimal'
 *
 * const warningStatus = determineParameterStatus('ammonia', 0.05)
 * // Returns: 'warning'
 * ```
 */
export function determineParameterStatus(
    param: 'ph' | 'temperatureCelsius' | 'dissolvedOxygenMgL' | 'ammoniaMgL',
    value: number,
): 'optimal' | 'acceptable' | 'warning' | 'critical' {
    const t = WATER_QUALITY_THRESHOLDS

    switch (param) {
        case 'ph':
            if (value >= t.ph.min + 0.5 && value <= t.ph.max - 0.5)
                return 'optimal'
            if (value >= t.ph.min && value <= t.ph.max) return 'acceptable'
            if (value >= t.ph.min - 1 && value <= t.ph.max + 1) return 'warning'
            return 'critical'

        case 'temperatureCelsius':
            if (
                value >= t.temperature.min + 1 &&
                value <= t.temperature.max - 1
            )
                return 'optimal'
            if (value >= t.temperature.min && value <= t.temperature.max)
                return 'acceptable'
            if (
                value >= t.temperature.min - 3 &&
                value <= t.temperature.max + 3
            )
                return 'warning'
            return 'critical'

        case 'dissolvedOxygenMgL':
            if (value >= t.dissolvedOxygen.min + 2) return 'optimal'
            if (value >= t.dissolvedOxygen.min) return 'acceptable'
            if (value >= t.dissolvedOxygen.min - 2) return 'warning'
            return 'critical'

        case 'ammoniaMgL':
            if (value <= t.ammonia.max / 2) return 'optimal'
            if (value <= t.ammonia.max) return 'acceptable'
            if (value <= t.ammonia.max * 2) return 'warning'
            return 'critical'

        default:
            return 'acceptable'
    }
}

/**
 * Check if water parameters indicate an alert condition.
 *
 * @param params - Object containing pH, temperature, DO, and ammonia levels
 * @returns True if any parameter is out of safe range
 */
export function isWaterQualityAlert(params: {
    ph: number
    temperatureCelsius: number
    dissolvedOxygenMgL: number
    ammoniaMgL: number
}): boolean {
    const { ph, temperatureCelsius, dissolvedOxygenMgL, ammoniaMgL } = params
    const t = WATER_QUALITY_THRESHOLDS

    return (
        ph < t.ph.min ||
        ph > t.ph.max ||
        temperatureCelsius < t.temperature.min ||
        temperatureCelsius > t.temperature.max ||
        dissolvedOxygenMgL < t.dissolvedOxygen.min ||
        ammoniaMgL > t.ammonia.max
    )
}

/**
 * Identify specific issues in water quality measurements.
 *
 * @param params - Object containing pH, temperature, DO, and ammonia levels
 * @returns Array of descriptive error messages for each threshold violation
 */
export function getWaterQualityIssues(params: {
    ph: number
    temperatureCelsius: number
    dissolvedOxygenMgL: number
    ammoniaMgL: number
}): Array<string> {
    const issues: Array<string> = []
    const t = WATER_QUALITY_THRESHOLDS

    if (params.ph < t.ph.min)
        issues.push(`pH too low (${params.ph}, min: ${t.ph.min})`)
    if (params.ph > t.ph.max)
        issues.push(`pH too high (${params.ph}, max: ${t.ph.max})`)
    if (params.temperatureCelsius < t.temperature.min)
        issues.push(
            `Temperature too low (${params.temperatureCelsius}°C, min: ${t.temperature.min}°C)`,
        )
    if (params.temperatureCelsius > t.temperature.max)
        issues.push(
            `Temperature too high (${params.temperatureCelsius}°C, max: ${t.temperature.max}°C)`,
        )
    if (params.dissolvedOxygenMgL < t.dissolvedOxygen.min)
        issues.push(
            `Dissolved oxygen too low (${params.dissolvedOxygenMgL}mg/L, min: ${t.dissolvedOxygen.min}mg/L)`,
        )
    if (params.ammoniaMgL > t.ammonia.max)
        issues.push(
            `Ammonia too high (${params.ammoniaMgL}mg/L, max: ${t.ammonia.max}mg/L)`,
        )

    return issues
}

/**
 * Summary of water quality parameters for a set of readings.
 */
export interface WaterQualitySummary {
    averagePh: number | null
    averageTemperature: number | null
    averageDissolvedOxygen: number | null
    averageAmmonia: number | null
    phStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
    temperatureStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
    dissolvedOxygenStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
    ammoniaStatus: 'optimal' | 'acceptable' | 'warning' | 'critical'
    alertCount: number
    issueCount: number
}

/**
 * Build a summary of water quality from a set of readings.
 *
 * @param readings - Array of water quality readings
 * @returns Summary object with averages and status assessments
 *
 * @example
 * ```ts
 * const summary = buildWaterQualitySummary(readings)
 * // Returns: { averagePh: 7.2, averageTemperature: 27, ... }
 * ```
 */
export function buildWaterQualitySummary(
    readings: Array<{
        ph: string
        temperatureCelsius: string
        dissolvedOxygenMgL: string
        ammoniaMgL: string
    }>,
): WaterQualitySummary {
    const averagePh = calculateAverageParameter(readings, 'ph')
    const averageTemperature = calculateAverageParameter(
        readings,
        'temperatureCelsius',
    )
    const averageDissolvedOxygen = calculateAverageParameter(
        readings,
        'dissolvedOxygenMgL',
    )
    const averageAmmonia = calculateAverageParameter(readings, 'ammoniaMgL')

    const phStatus = averagePh
        ? determineParameterStatus('ph', averagePh)
        : 'acceptable'
    const temperatureStatus = averageTemperature
        ? determineParameterStatus('temperatureCelsius', averageTemperature)
        : 'acceptable'
    const dissolvedOxygenStatus = averageDissolvedOxygen
        ? determineParameterStatus('dissolvedOxygenMgL', averageDissolvedOxygen)
        : 'acceptable'
    const ammoniaStatus = averageAmmonia
        ? determineParameterStatus('ammoniaMgL', averageAmmonia)
        : 'acceptable'

    // Count alerts
    let alertCount = 0
    let issueCount = 0
    for (const reading of readings) {
        const params = {
            ph: parseFloat(reading.ph),
            temperatureCelsius: parseFloat(reading.temperatureCelsius),
            dissolvedOxygenMgL: parseFloat(reading.dissolvedOxygenMgL),
            ammoniaMgL: parseFloat(reading.ammoniaMgL),
        }
        if (isWaterQualityAlert(params)) {
            alertCount++
        }
        issueCount += getWaterQualityIssues(params).length
    }

    return {
        averagePh,
        averageTemperature,
        averageDissolvedOxygen,
        averageAmmonia,
        phStatus,
        temperatureStatus,
        dissolvedOxygenStatus,
        ammoniaStatus,
        alertCount,
        issueCount,
    }
}

/**
 * Trend direction for water quality parameters.
 */
export type ParameterTrend = 'improving' | 'stable' | 'declining'

/**
 * Calculate the trend for a specific parameter across readings.
 *
 * @param readings - Array of readings ordered by date (oldest first)
 * @param param - The parameter to calculate trend for
 * @returns Trend indicating if the parameter is improving, stable, or declining
 *
 * @example
 * ```ts
 * const trend = calculateParameterTrend(readings, 'ph')
 * // Returns: 'stable'
 * ```
 */
export function calculateParameterTrend(
    readings: Array<{
        ph: string
        temperatureCelsius: string
        dissolvedOxygenMgL: string
        ammoniaMgL: string
    }>,
    param: 'ph' | 'temperatureCelsius' | 'dissolvedOxygenMgL' | 'ammoniaMgL',
): ParameterTrend {
    if (readings.length < 2) {
        return 'stable'
    }

    // Get the oldest and newest readings
    const oldest = readings[0]
    const newest = readings[readings.length - 1]

    const oldestValue = parseFloat(oldest[param])
    const newestValue = parseFloat(newest[param])

    if (isNaN(oldestValue) || isNaN(newestValue)) {
        return 'stable'
    }

    // For ammonia, decreasing is improving
    if (param === 'ammoniaMgL') {
        const changePercent =
            oldestValue !== 0
                ? ((newestValue - oldestValue) / oldestValue) * 100
                : 0
        if (changePercent < -10) return 'improving'
        if (changePercent > 10) return 'declining'
        return 'stable'
    }

    // For dissolved oxygen, increasing is improving
    if (param === 'dissolvedOxygenMgL') {
        const changePercent =
            oldestValue !== 0
                ? ((newestValue - oldestValue) / oldestValue) * 100
                : 0
        if (changePercent > 10) return 'improving'
        if (changePercent < -10) return 'declining'
        return 'stable'
    }

    // For pH and temperature, stability is best (check if within acceptable range)
    const changePercent =
        oldestValue !== 0
            ? ((newestValue - oldestValue) / oldestValue) * 100
            : 0

    // Check if both values are within acceptable range
    if (param === 'ph') {
        const t = WATER_QUALITY_THRESHOLDS
        const inRange =
            oldestValue >= t.ph.min &&
            oldestValue <= t.ph.max &&
            newestValue >= t.ph.min &&
            newestValue <= t.ph.max
        if (inRange) {
            if (Math.abs(changePercent) < 5) return 'stable'
            return changePercent > 0 ? 'improving' : 'declining'
        }
    }

    if (param === 'temperatureCelsius') {
        const t = WATER_QUALITY_THRESHOLDS
        const inRange =
            oldestValue >= t.temperature.min &&
            oldestValue <= t.temperature.max &&
            newestValue >= t.temperature.min &&
            newestValue <= t.temperature.max
        if (inRange) {
            if (Math.abs(changePercent) < 5) return 'stable'
            return changePercent > 0 ? 'improving' : 'declining'
        }
    }

    if (Math.abs(changePercent) < 5) return 'stable'
    return changePercent > 0 ? 'improving' : 'declining'
}
