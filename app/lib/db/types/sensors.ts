import type { Generated } from 'kysely'

// ============================================
// IoT Sensor Tables
// ============================================

/** Sensor type options */
export type SensorType =
  | 'temperature'
  | 'humidity'
  | 'ammonia'
  | 'dissolved_oxygen'
  | 'ph'
  | 'water_level'
  | 'water_temperature'
  | 'hive_weight'
  | 'hive_temperature'
  | 'hive_humidity'

/** Sensor threshold configuration */
export interface SensorThresholds {
  minValue: number | null
  maxValue: number | null
  warningMinValue: number | null
  warningMaxValue: number | null
}

/** Sensor trend alert configuration */
export interface SensorTrendConfig {
  rateThreshold: number
  rateWindowMinutes: number
}

/**
 * IoT sensors for environmental monitoring
 */
export interface SensorTable {
  id: Generated<string>
  farmId: string
  structureId: string | null
  name: string
  sensorType: SensorType
  apiKeyHash: string
  pollingIntervalMinutes: number
  isActive: Generated<boolean>
  lastReadingAt: Date | null
  lastUsedAt: Date | null
  requestCount: Generated<number>
  thresholds: SensorThresholds | null
  trendConfig: SensorTrendConfig | null
  createdAt: Generated<Date>
  deletedAt: Date | null
}

/**
 * Time-series sensor readings
 */
export interface SensorReadingTable {
  id: Generated<string>
  sensorId: string
  value: string // DECIMAL(12,4)
  recordedAt: Date
  isAnomaly: Generated<boolean>
  metadata: Record<string, any> | null
  createdAt: Generated<Date>
}

/**
 * Aggregated sensor data for historical queries
 */
export interface SensorAggregateTable {
  id: Generated<string>
  sensorId: string
  periodType: 'hourly' | 'daily'
  periodStart: Date
  avgValue: string // DECIMAL(12,4)
  minValue: string // DECIMAL(12,4)
  maxValue: string // DECIMAL(12,4)
  readingCount: number
}

/** Alert types for sensors */
export type SensorAlertType =
  | 'threshold_high'
  | 'threshold_low'
  | 'trend_rising'
  | 'trend_falling'

/**
 * Sensor alert history
 */
export interface SensorAlertTable {
  id: Generated<string>
  sensorId: string
  alertType: SensorAlertType
  severity: 'warning' | 'critical'
  triggerValue: string // DECIMAL(12,4)
  thresholdValue: string // DECIMAL(12,4)
  message: string
  acknowledged: Generated<boolean>
  acknowledgedAt: Date | null
  acknowledgedBy: string | null
  createdAt: Generated<Date>
}

/**
 * Per-sensor alert configuration
 */
export interface SensorAlertConfigTable {
  id: Generated<string>
  sensorId: string
  minThreshold: string | null // DECIMAL(12,4)
  maxThreshold: string | null // DECIMAL(12,4)
  warningMinThreshold: string | null // DECIMAL(12,4)
  warningMaxThreshold: string | null // DECIMAL(12,4)
  rateThreshold: string | null // DECIMAL(12,4)
  rateWindowMinutes: number
  cooldownMinutes: number
  smsEnabled: Generated<boolean>
  emailEnabled: Generated<boolean>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}
