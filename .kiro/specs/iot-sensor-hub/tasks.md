# Implementation Plan: IoT Sensor Hub

## Overview

This implementation plan converts the IoT Sensor Hub design into actionable coding tasks. The approach prioritizes database schema first, then core ingestion, followed by alerting, and finally UI components.

## Codebase Context

**Files to UPDATE:**

- `app/lib/db/types.ts` - Add sensor-related table interfaces
- `app/lib/errors/error-map.ts` - Add sensor error codes
- `app/features/notifications/types.ts` - Add 'sensorAlert' notification type
- `app/features/structures/server.ts` - Add sensor count to structure queries

**Files to CREATE:**

- `app/lib/db/migrations/2026-XX-XX-001-sensors-tables.ts` - New migration
- `app/features/sensors/` - New feature module
- `app/routes/api/sensors/readings.ts` - HTTP webhook endpoint
- `app/components/sensors/` - UI components
- `app/routes/_auth/sensors/` - Sensor management pages
- `examples/firmware/esp32-dht22/` - Example firmware

**Key constraints:**

- API key authentication for ingestion endpoint (not session-based)
- Time-series optimized queries for readings
- Rate limiting per sensor (100 req/min)
- All server functions use dynamic imports for Cloudflare Workers

## Tasks

- [ ]   1. Database schema and migration
    - [ ] 1.1 Create database migration for sensor tables
        - Create migration file `app/lib/db/migrations/2026-01-27-001-sensors-tables.ts`
        - Add `sensors` table with all columns (id, farm_id, structure_id, name, sensor_type, api_key_hash, polling_interval_minutes, is_active, last_reading_at, thresholds, trend_config, created_at, deleted_at)
        - Add `sensor_readings` table with time-series optimized indexes
        - Add `sensor_aggregates` table for hourly/daily rollups
        - Add `sensor_alerts` table for alert history
        - Add `sensor_alert_config` table for per-sensor alert settings
        - Add all indexes (farm, structure, api_key, time-series)
        - Include rollback function (`down`)
        - _Requirements: 1.1, 2.1, 3.1, 3.5, 6.1_

    - [ ] 1.2 Update database types in `app/lib/db/types.ts`
        - Add `SensorTable` interface
        - Add `SensorReadingTable` interface
        - Add `SensorAggregateTable` interface
        - Add `SensorAlertTable` interface
        - Add `SensorAlertConfigTable` interface
        - Add all tables to Database interface
        - _Requirements: 1.1_

    - [ ] 1.3 Add error codes to `app/lib/errors/error-map.ts`
        - Add `SENSOR_NOT_FOUND` (40420)
        - Add `INVALID_API_KEY` (40103)
        - Add `SENSOR_INACTIVE` (40303)
        - Add `READING_TOO_OLD` (40003)
        - Add `RATE_LIMIT_EXCEEDED` (42900)
        - _Requirements: 2.1, 2.3_

- [ ]   2. Checkpoint - Run migration and verify schema
    - Run `bun run db:migrate` and verify tables created correctly
    - Verify indexes are created
    - Ensure all tests pass

- [ ]   3. Sensors feature module - Core
    - [ ] 3.1 Create sensor types file `app/features/sensors/types.ts`
        - Define `SensorType` union type
        - Define `Sensor` interface
        - Define `SensorReading` interface
        - Define `SensorThresholds` interface
        - Define `TrendConfig` interface
        - Define `AlertCheckResult` interface
        - _Requirements: 1.1_

    - [ ] 3.2 Create sensor constants `app/features/sensors/constants.ts`
        - Define `SENSOR_TYPES` array
        - Define `SENSOR_TYPE_DEFAULTS` with thresholds, units, valid ranges
        - Define `SPECIES_SENSOR_OVERRIDES` for species-specific thresholds
        - Define `POLLING_INTERVALS` options
        - _Requirements: 2.4, 3.1_

    - [ ] 3.3 Create sensors repository `app/features/sensors/repository.ts`
        - Implement `insertSensor(db, data)` function
        - Implement `getSensorById(db, id)` function
        - Implement `getSensorsByFarm(db, farmId)` function
        - Implement `getSensorsByStructure(db, structureId)` function
        - Implement `getSensorByApiKeyHash(db, hash)` function
        - Implement `updateSensor(db, id, data)` function
        - Implement `updateLastReadingAt(db, id)` function
        - Implement `softDeleteSensor(db, id)` function
        - _Requirements: 1.1, 1.2, 1.3, 1.4_

    - [ ] 3.4 Create readings repository `app/features/sensors/readings-repository.ts`
        - Implement `insertReading(db, data)` function
        - Implement `insertReadingsBatch(db, readings)` function with deduplication
        - Implement `getLatestReading(db, sensorId)` function
        - Implement `getReadingsInRange(db, sensorId, start, end, limit)` function
        - Implement `getReadingsForChart(db, sensorId, start, end, bucketMinutes)` function
        - Implement `deleteOldReadings(db, cutoffDate)` function
        - _Requirements: 2.1, 2.3, 4.2, 4.3_

    - [ ] 3.5 Create sensor service `app/features/sensors/service.ts`
        - Implement `generateApiKey()` function (crypto random)
        - Implement `hashApiKey(key)` function (bcrypt)
        - Implement `verifyApiKey(key, hash)` function
        - Implement `validateReadingValue(value, sensorType)` function
        - Implement `getSensorStatus(sensor, lastReading)` function
        - Implement `formatSensorValue(value, sensorType)` function
        - _Requirements: 1.1, 2.4, 1.2_

- [ ]   4. Checkpoint - Verify core module
    - Write unit tests for service functions
    - Verify API key generation and hashing
    - Ensure all tests pass

- [ ]   5. Alert engine
    - [ ] 5.1 Create alert service `app/features/sensors/alert-service.ts`
        - Implement `checkThresholdAlert(value, thresholds, sensorType)` function
        - Implement `checkTrendAlert(readings, trendConfig, sensorType)` function
        - Implement `isInCooldown(lastAlertTime, cooldownMinutes)` function
        - Implement `calculateRateOfChange(readings)` function
        - _Requirements: 3.1, 3.2, 3.4_

    - [ ] 5.2 Create alerts repository `app/features/sensors/alerts-repository.ts`
        - Implement `insertAlert(db, data)` function
        - Implement `getAlertsBySensor(db, sensorId, limit)` function
        - Implement `getUnacknowledgedAlerts(db, farmId)` function
        - Implement `acknowledgeAlert(db, alertId, userId)` function
        - Implement `getLastAlertBySensorAndType(db, sensorId, alertType)` function
        - Implement `getAlertConfig(db, sensorId)` function
        - Implement `upsertAlertConfig(db, sensorId, config)` function
        - _Requirements: 3.1, 3.4, 3.5_

    - [ ] 5.3 Create alert processor `app/features/sensors/alert-processor.ts`
        - Implement `processReading(db, sensor, reading)` function
        - Implement `sendAlertNotifications(db, sensor, alert, config)` function
        - Integrate with existing notification system
        - Integrate with SMS/email integrations
        - _Requirements: 3.1, 3.2, 3.3, 3.4_

    - [ ]\* 5.4 Write property tests for alert service
        - **Property 2: Threshold alert triggering**
        - **Property 3: Trend alert calculation**
        - **Property 4: Alert cooldown enforcement**
        - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ]   6. Checkpoint - Verify alert engine
    - Test threshold alerts with various values
    - Test trend alerts with sample data
    - Verify cooldown logic
    - Ensure all tests pass

- [ ]   7. Server functions
    - [ ] 7.1 Create sensor server functions `app/features/sensors/server.ts`
        - Implement `createSensorFn` with Zod validation
        - Implement `getSensorsFn` with filtering
        - Implement `getSensorFn` for single sensor
        - Implement `updateSensorFn` for configuration updates
        - Implement `deleteSensorFn` for soft delete
        - Implement `regenerateApiKeyFn` for key rotation
        - Implement `getSensorChartDataFn` for historical data
        - Implement `getAlertsFn` for alert history
        - Implement `acknowledgeAlertFn` for alert management
        - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.5, 4.3_

    - [ ] 7.2 Create feature index `app/features/sensors/index.ts`
        - Export all public types
        - Export all server functions
        - Export constants
        - _Requirements: 1.1_

- [ ]   8. HTTP Ingestion endpoint
    - [ ] 8.1 Create API route `app/routes/api/sensors/readings.ts`
        - Implement POST handler with API key authentication
        - Parse X-Sensor-Key header
        - Validate payload (single or batch)
        - Validate reading values against sensor type ranges
        - Insert readings with deduplication
        - Trigger alert processing
        - Return success/error response
        - Implement rate limiting (100 req/min per sensor)
        - _Requirements: 2.1, 2.3, 2.4_

    - [ ]\* 8.2 Write property tests for ingestion
        - **Property 1: Reading data integrity**
        - **Property 5: API key authentication**
        - **Property 8: Batch upload deduplication**
        - **Property 9: Anomaly detection**
        - **Validates: Requirements 2.1, 2.3, 2.4, 8.2**

- [ ]   9. Checkpoint - Verify ingestion
    - Test single reading upload
    - Test batch upload
    - Test invalid API key rejection
    - Test rate limiting
    - Ensure all tests pass

- [ ]   10. Data aggregation
    - [ ] 10.1 Create aggregation service `app/features/sensors/aggregation-service.ts`
        - Implement `aggregateHourlyReadings()` function
        - Implement `aggregateDailyReadings()` function
        - Implement `getAggregatesForChart(db, sensorId, periodType, start, end)` function
        - _Requirements: 6.1_

    - [ ] 10.2 Create aggregation cron job (Cloudflare Cron Trigger)
        - Add cron trigger to `wrangler.jsonc`
        - Create handler in `app/server.ts` or dedicated worker
        - Schedule hourly aggregation for readings > 90 days
        - Schedule daily aggregation for hourly data > 1 year
        - _Requirements: 6.1_

    - [ ]\* 10.3 Write property test for aggregation
        - **Property 7: Data aggregation correctness**
        - **Validates: Requirements 6.1**

- [ ]   11. Update notification types
    - [ ] 11.1 Update `app/features/notifications/types.ts`
        - Add 'sensorAlert' to NotificationType union
        - _Requirements: 3.3_

- [ ]   12. UI Components
    - [ ] 12.1 Create sensor card component `app/components/sensors/sensor-card.tsx`
        - Display sensor name, type, current value
        - Color-coded status indicator
        - Time since last reading
        - Mini sparkline chart
        - _Requirements: 4.1, 4.2_

    - [ ] 12.2 Create sensor chart component `app/components/sensors/sensor-chart.tsx`
        - Line chart with Recharts
        - Time range selector (24h, 7d, 30d, 90d)
        - Threshold reference lines
        - Zoom and pan support
        - _Requirements: 4.3_

    - [ ] 12.3 Create sensor list component `app/components/sensors/sensor-list.tsx`
        - Table/grid of sensors
        - Status filtering
        - Structure filtering
        - Sort by name, status, last reading
        - _Requirements: 1.2_

    - [ ] 12.4 Create sensor form dialog `app/components/sensors/sensor-form-dialog.tsx`
        - Create/edit sensor form
        - Sensor type selection
        - Structure assignment
        - Threshold configuration
        - API key display (on create only)
        - _Requirements: 1.1, 1.3_

    - [ ] 12.5 Create alert history component `app/components/sensors/alert-history.tsx`
        - List of alerts with timestamp, type, value
        - Acknowledge button
        - Filter by severity, date range
        - _Requirements: 3.5_

- [ ]   13. Sensor routes
    - [ ] 13.1 Create sensors list page `app/routes/_auth/sensors/index.tsx`
        - Loader fetches sensors for user's farms
        - Display sensor list with status
        - Quick actions (add sensor, view alerts)
        - _Requirements: 1.2_

    - [ ] 13.2 Create sensor detail page `app/routes/_auth/sensors/$sensorId.tsx`
        - Loader fetches sensor details and recent readings
        - Display current value card
        - Historical chart
        - Alert history
        - Configuration panel
        - _Requirements: 4.1, 4.3, 3.5_

    - [ ] 13.3 Update structure detail to show sensors
        - Add sensors section to structure detail page
        - Show sensor cards for assigned sensors
        - Link to add sensor for this structure
        - _Requirements: 5.1_

    - [ ] 13.4 Update farm dashboard for sensor status
        - Add sensor status summary card
        - Show worst-status-wins per structure
        - Link to sensors page
        - _Requirements: 5.2_

- [ ]   14. Checkpoint - Verify UI
    - Test sensor creation flow
    - Test chart rendering
    - Test alert acknowledgment
    - Ensure all tests pass

- [ ]   15. MQTT Support (Optional)
    - [ ] 15.1 Create MQTT handler `app/features/sensors/mqtt-handler.ts`
        - Implement topic parsing
        - Implement authentication
        - Implement message processing
        - _Requirements: 2.2_

    - [ ] 15.2 Document MQTT broker setup
        - Add MQTT configuration to docs
        - Document topic format
        - Document authentication
        - _Requirements: 2.2_

- [ ]   16. Documentation and examples
    - [ ] 16.1 Create ESP32 firmware example
        - Create `examples/firmware/esp32-dht22/` directory
        - Add main.cpp with WiFi, HTTP, buffering
        - Add platformio.ini configuration
        - Add README with setup instructions
        - _Requirements: 7.1_

    - [ ] 16.2 Create API documentation
        - Document HTTP endpoint
        - Document payload formats
        - Document error codes
        - Document rate limits
        - Add to `docs/api/` or OpenAPI spec
        - _Requirements: 7.2_

    - [ ] 16.3 Update user settings for sensor preferences
        - Add sensor alert preferences to user_settings
        - Add default thresholds per sensor type
        - _Requirements: 8.1_

- [ ]   17. Final checkpoint - Full integration test
    - Create sensor via UI
    - Send readings via HTTP endpoint
    - Verify alerts trigger correctly
    - Verify notifications sent
    - Verify charts display data
    - Ensure all tests pass

## Notes

- Tasks marked with `*` are optional property tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- MQTT support (Task 15) can be deferred if needed
- All server functions use dynamic imports for Cloudflare Workers compatibility
- Rate limiting uses Cloudflare's built-in rate limiting or in-memory counter

## Codebase Integration Checklist

### Database Types (app/lib/db/types.ts)

- [ ] Add `sensors` to Database interface
- [ ] Add `sensor_readings` to Database interface
- [ ] Add `sensor_aggregates` to Database interface
- [ ] Add `sensor_alerts` to Database interface
- [ ] Add `sensor_alert_config` to Database interface

### Error Codes (app/lib/errors/error-map.ts)

Add these new error codes:

- `SENSOR_NOT_FOUND` (40420) - Sensor not found
- `INVALID_API_KEY` (40103) - Invalid sensor API key
- `SENSOR_INACTIVE` (40303) - Sensor is deactivated
- `READING_TOO_OLD` (40003) - Reading timestamp too old to accept
- `RATE_LIMIT_EXCEEDED` (42900) - Sensor rate limit exceeded

### Notification Types (app/features/notifications/types.ts)

Add to NotificationType union:

- `'sensorAlert'` - Sensor threshold or trend alert triggered

### Required Imports Pattern

```typescript
// Server functions MUST use this pattern for Cloudflare Workers:
const { getDb } = await import('~/lib/db')
const db = await getDb()

// Auth middleware (for authenticated endpoints):
const { requireAuth } = await import('~/features/auth/server-middleware')
const session = await requireAuth()

// Farm access verification:
const { verifyFarmAccess } = await import('~/features/auth/utils')
await verifyFarmAccess(userId, farmId)

// Error handling:
import { AppError } from '~/lib/errors'
```

### API Key Authentication Pattern (for ingestion endpoint)

```typescript
// For the HTTP ingestion endpoint (no session auth):
const apiKey = request.headers.get('X-Sensor-Key')
if (!apiKey) {
    throw new AppError('INVALID_API_KEY')
}

const { getDb } = await import('~/lib/db')
const db = await getDb()

// Verify API key and get sensor
const sensor = await getSensorByApiKeyHash(db, hashApiKey(apiKey))
if (!sensor) {
    throw new AppError('INVALID_API_KEY')
}
if (!sensor.isActive) {
    throw new AppError('SENSOR_INACTIVE')
}
```

### Currency Display Pattern

```typescript
// In UI components displaying costs (if any):
import { useFormatCurrency } from '~/features/settings'

const { format, symbol } = useFormatCurrency()
// Use format(amount) for display
```

### Sensor Types (constants)

Define these sensor types in constants:

- `temperature` - Temperature sensors (°C)
- `humidity` - Humidity sensors (%)
- `ph` - pH sensors (0-14)
- `dissolved_oxygen` - DO sensors (mg/L)
- `ammonia` - Ammonia sensors (ppm)
- `water_level` - Water level sensors (cm)
- `light` - Light intensity sensors (lux)
- `co2` - CO2 sensors (ppm)

### Species-Specific Thresholds

Use Title Case species names to match `growth_standards.species`:

- Poultry: `Broiler`, `Layer`, `Turkey`
- Aquaculture: `Catfish`, `Tilapia`
- Ruminants: `Beef_Cattle`, `Dairy_Cattle`, `Meat_Goat`, `Dairy_Goat`, `Meat_Sheep`
