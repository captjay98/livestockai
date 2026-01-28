/**
 * Sensor readings ingestion endpoint
 * 
 * This file exports a server function that can be called directly.
 * For HTTP API access, use the server function from a route handler.
 * 
 * Example curl:
 * curl -X POST http://localhost:3001/api/sensors/readings \
 *   -H "X-Sensor-Key: your-api-key" \
 *   -H "Content-Type: application/json" \
 *   -d '{"value": 25.5}'
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const rateLimits = new Map<string, { count: number; minute: number }>()

const readingSchema = z.object({
  value: z.number(),
  timestamp: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
})

export const ingestReadingsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    apiKey: z.string(),
    readings: z.union([readingSchema, z.array(readingSchema)]),
  }))
  .handler(async ({ data }) => {
    const { apiKey, readings: rawReadings } = data
    
    // Rate limiting
    const now = Date.now()
    const minute = Math.floor(now / 60000)
    const rl = rateLimits.get(apiKey)
    
    if (rl && rl.minute === minute && rl.count >= 100) {
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    
    rateLimits.set(apiKey, { 
      count: rl?.minute === minute ? rl.count + 1 : 1, 
      minute 
    })

    const readings = Array.isArray(rawReadings) ? rawReadings : [rawReadings]
    const maxAge = now - 7 * 24 * 60 * 60 * 1000

    // Validate timestamps
    for (const r of readings) {
      if (r.timestamp && r.timestamp.getTime() < maxAge) {
        throw new Error('READING_TOO_OLD')
      }
    }

    // DB operations
    const { getDb } = await import('~/lib/db')
    const { updateLastReadingAt } = await import('~/features/sensors/repository')
    const { insertReadingsBatch } = await import('~/features/sensors/readings-repository')
    const { verifyApiKey, validateReadingValue } = await import('~/features/sensors/service')

    const db = await getDb()

    // Find sensor by API key
    const sensors = await db
      .selectFrom('sensors')
      .selectAll()
      .where('isActive', '=', true)
      .where('deletedAt', 'is', null)
      .execute()
    
    let sensor = null
    for (const s of sensors) {
      if (await verifyApiKey(apiKey, s.apiKeyHash)) {
        sensor = s
        break
      }
    }

    if (!sensor) {
      throw new Error('INVALID_API_KEY')
    }

    // Prepare readings with anomaly detection
    const toInsert = readings.map(r => {
      const { isAnomaly } = validateReadingValue(r.value, sensor.sensorType)
      return {
        sensorId: sensor.id,
        value: r.value,
        recordedAt: r.timestamp || new Date(),
        isAnomaly,
        metadata: r.metadata || null,
      }
    })

    await insertReadingsBatch(db, toInsert)
    await updateLastReadingAt(db, sensor.id)

    // Process alerts for each reading
    const { processReadingForAlerts } = await import('~/features/sensors/alert-processor')
    for (const reading of toInsert) {
      await processReadingForAlerts(db, sensor, reading.value)
    }

    return { success: true, count: readings.length }
  })
