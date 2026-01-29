import type { AlertCheckResult, SensorReading } from './types'

export function checkThresholdAlert(
  value: number,
  thresholds: { min?: number | null; max?: number | null },
  sensorType: string,
): AlertCheckResult | null {
  if (thresholds.max != null && value > thresholds.max) {
    return {
      shouldAlert: true,
      alertType: 'threshold_high',
      severity: 'critical',
      message: `${sensorType} too high: ${value}`,
      triggerValue: value,
      thresholdValue: thresholds.max,
    }
  }

  if (thresholds.min != null && value < thresholds.min) {
    return {
      shouldAlert: true,
      alertType: 'threshold_low',
      severity: 'warning',
      message: `${sensorType} too low: ${value}`,
      triggerValue: value,
      thresholdValue: thresholds.min,
    }
  }

  return null
}

export function checkTrendAlert(
  readings: Array<SensorReading>,
  trendConfig: { rateThreshold: number; rateWindowMinutes: number },
  sensorType: string,
): AlertCheckResult | null {
  if (readings.length < 2) return null

  const rate = calculateRateOfChange(readings)

  if (Math.abs(rate) > trendConfig.rateThreshold) {
    const isRising = rate > 0
    return {
      shouldAlert: true,
      alertType: isRising ? 'trend_rising' : 'trend_falling',
      severity: 'warning',
      message: `${sensorType} ${isRising ? 'rising' : 'falling'} rapidly: ${rate.toFixed(2)}/hr`,
      triggerValue: rate,
      thresholdValue: trendConfig.rateThreshold,
    }
  }

  return null
}

export function isInCooldown(
  lastAlertTime: Date | null,
  cooldownMinutes: number,
): boolean {
  if (!lastAlertTime) return false
  const now = new Date()
  const cooldownMs = cooldownMinutes * 60 * 1000
  return now.getTime() - lastAlertTime.getTime() < cooldownMs
}

export function calculateRateOfChange(readings: Array<SensorReading>): number {
  if (readings.length < 2) return 0

  const latest = readings[readings.length - 1]
  const earliest = readings[0]

  const timeDiffHours =
    (latest.recordedAt.getTime() - earliest.recordedAt.getTime()) /
    (1000 * 60 * 60)
  if (timeDiffHours === 0) return 0

  return (latest.value - earliest.value) / timeDiffHours
}
