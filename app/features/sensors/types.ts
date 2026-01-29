/**
 * Sensor types for the IoT Sensor Hub feature
 */

import type {
  SensorAlertType,
  SensorThresholds,
  SensorTrendConfig,
  SensorType,
} from '~/lib/db/types'

export type { SensorType, SensorThresholds, SensorTrendConfig, SensorAlertType }

/** Sensor status based on last reading time */
export type SensorStatus = 'online' | 'stale' | 'offline'

/** Sensor with computed status */
export interface Sensor {
  id: string
  farmId: string
  structureId: string | null
  name: string
  sensorType: SensorType
  pollingIntervalMinutes: number
  isActive: boolean
  lastReadingAt: Date | null
  thresholds: SensorThresholds | null
  trendConfig: SensorTrendConfig | null
  createdAt: Date
}

/** Sensor with additional computed fields for display */
export interface SensorWithStatus extends Sensor {
  status: SensorStatus
  structureName: string | null
  farmName: string | null
  latestValue: number | null
}

/** Sensor reading */
export interface SensorReading {
  id: string
  sensorId: string
  value: number
  recordedAt: Date
  isAnomaly: boolean
  metadata: Record<string, any> | null
}

/** Alert check result from service layer */
export interface AlertCheckResult {
  shouldAlert: boolean
  alertType: SensorAlertType
  severity: 'warning' | 'critical'
  message: string
  triggerValue: number
  thresholdValue: number
}

/** Chart data point for visualization */
export interface ChartDataPoint {
  timestamp: Date
  value: number
  isAnomaly?: boolean
}

/** Sensor alert for display */
export interface SensorAlert {
  id: string
  sensorId: string
  alertType: SensorAlertType
  severity: 'warning' | 'critical'
  triggerValue: number
  thresholdValue: number
  message: string
  acknowledged: boolean
  acknowledgedAt: Date | null
  acknowledgedBy: string | null
  createdAt: Date
}

/** Data for creating a new sensor */
export interface CreateSensorData {
  farmId: string
  structureId?: string | null
  name: string
  sensorType: SensorType
  pollingIntervalMinutes?: number
  thresholds?: SensorThresholds | null
  trendConfig?: SensorTrendConfig | null
}

/** Data for updating a sensor */
export interface UpdateSensorData {
  name?: string
  structureId?: string | null
  pollingIntervalMinutes?: number
  isActive?: boolean
  thresholds?: SensorThresholds | null
  trendConfig?: SensorTrendConfig | null
}

/** Data for inserting a reading */
export interface ReadingInsert {
  sensorId: string
  value: number
  recordedAt: Date
  isAnomaly?: boolean
  metadata?: Record<string, any> | null
}
