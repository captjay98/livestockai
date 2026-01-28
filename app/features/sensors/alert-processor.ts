/**
 * Alert processor - processes sensor readings and triggers alerts
 */

import { checkThresholdAlert, checkTrendAlert, isInCooldown } from './alert-service'
import { getAlertConfig, getLastAlertBySensorAndType, insertAlert } from './alerts-repository'
import { getReadingsInRange } from './readings-repository'
import { SENSOR_TYPE_CONFIG } from './constants'
import type { Database, SensorAlertType  } from '~/lib/db/types'
import type { Kysely } from 'kysely'

interface SensorWithConfig {
  id: string
  farmId: string
  name: string
  sensorType: string
  thresholds: { minValue: number | null; maxValue: number | null } | null
  trendConfig: { rateThreshold: number; rateWindowMinutes: number } | null
}

/**
 * Process a new reading and trigger alerts if needed
 */
export async function processReadingForAlerts(
  db: Kysely<Database>,
  sensor: SensorWithConfig,
  value: number,
): Promise<void> {
  const config = await getAlertConfig(db, sensor.id)
  const cooldownMinutes = config?.cooldownMinutes ?? 30

  // Get thresholds (sensor-specific or defaults)
  const sensorTypeKey = sensor.sensorType as keyof typeof SENSOR_TYPE_CONFIG
  const sensorConfig = SENSOR_TYPE_CONFIG[sensorTypeKey]
  const defaultThresholds = sensorConfig.defaultThresholds
  const thresholds = sensor.thresholds ?? defaultThresholds

  // Normalize threshold format
  const normalizedThresholds = {
    min: 'minValue' in thresholds ? thresholds.minValue : (thresholds as { min: number }).min,
    max: 'maxValue' in thresholds ? thresholds.maxValue : (thresholds as { max: number }).max,
  }
  
  // Check threshold alert
  const thresholdResult = checkThresholdAlert(value, normalizedThresholds, sensor.sensorType)
  
  if (thresholdResult?.shouldAlert) {
    const lastAlert = await getLastAlertBySensorAndType(db, sensor.id, thresholdResult.alertType)
    
    if (!isInCooldown(lastAlert?.createdAt ?? null, cooldownMinutes)) {
      await insertAlert(db, {
        sensorId: sensor.id,
        alertType: thresholdResult.alertType,
        severity: thresholdResult.severity,
        triggerValue: thresholdResult.triggerValue,
        thresholdValue: thresholdResult.thresholdValue,
        message: thresholdResult.message,
      })

      // Send external notifications
      await sendAlertNotifications(db, sensor, thresholdResult, config)
    }
  }

  // Check trend alert if configured
  const trendConfig = sensor.trendConfig ?? { rateThreshold: 5, rateWindowMinutes: 60 }
  
  const windowStart = new Date(Date.now() - trendConfig.rateWindowMinutes * 60 * 1000)
  const readings = await getReadingsInRange(db, sensor.id, windowStart, new Date(), 100)
  
  if (readings.length >= 2) {
    const trendResult = checkTrendAlert(readings, trendConfig, sensor.sensorType)
    
    if (trendResult?.shouldAlert) {
      const lastAlert = await getLastAlertBySensorAndType(db, sensor.id, trendResult.alertType)
      
      if (!isInCooldown(lastAlert?.createdAt ?? null, cooldownMinutes)) {
        await insertAlert(db, {
          sensorId: sensor.id,
          alertType: trendResult.alertType,
          severity: trendResult.severity,
          triggerValue: trendResult.triggerValue,
          thresholdValue: trendResult.thresholdValue,
          message: trendResult.message,
        })

        await sendAlertNotifications(db, sensor, trendResult, config)
      }
    }
  }
}

/**
 * Send external notifications for an alert
 */
async function sendAlertNotifications(
  db: Kysely<Database>,
  sensor: SensorWithConfig,
  alert: { alertType: SensorAlertType; severity: string; message: string; triggerValue: number },
  config: { smsEnabled?: boolean; emailEnabled?: boolean } | undefined,
): Promise<void> {
  // Create in-app notification
  const { createNotification } = await import('~/features/notifications/server')
  
  // Get farm owner
  const farmUser = await db
    .selectFrom('user_farms')
    .select(['userId'])
    .where('farmId', '=', sensor.farmId)
    .where('role', '=', 'owner')
    .executeTakeFirst()

  if (!farmUser) return

  await createNotification({
    userId: farmUser.userId,
    farmId: sensor.farmId,
    type: 'sensorAlert',
    title: `Sensor Alert: ${sensor.name}`,
    message: alert.message,
    actionUrl: `/sensors/${sensor.id}`,
    metadata: {
      sensorId: sensor.id,
      alertType: alert.alertType,
      severity: alert.severity,
      value: alert.triggerValue,
    },
  })

  // Send email if enabled
  if (config?.emailEnabled !== false) {
    try {
      const { INTEGRATIONS } = await import('~/features/integrations/config')
      if (INTEGRATIONS.email) {
        const user = await db
          .selectFrom('users')
          .select(['email'])
          .where('id', '=', farmUser.userId)
          .executeTakeFirst()

        if (user?.email) {
          const { sendEmail } = await import('~/features/integrations/email')
          await sendEmail({
            to: user.email,
            subject: `🚨 Sensor Alert: ${sensor.name}`,
            html: `<p><strong>${sensor.name}</strong></p><p>${alert.message}</p><p>Value: ${alert.triggerValue}</p>`,
          })
        }
      }
    } catch {
      // Email failure is non-critical
    }
  }

  // Send SMS if enabled and severity is critical
  if (config?.smsEnabled && alert.severity === 'critical') {
    try {
      const { INTEGRATIONS } = await import('~/features/integrations/config')
      if (INTEGRATIONS.sms) {
        const user = await db
          .selectFrom('users')
          .select(['id'])
          .where('id', '=', farmUser.userId)
          .executeTakeFirst()

        // Note: Would need phone number from user profile
        // For now, just log that SMS would be sent
        console.log(`[SMS] Would send alert to user ${user?.id}: ${alert.message}`)
      }
    } catch {
      // SMS failure is non-critical
    }
  }
}
