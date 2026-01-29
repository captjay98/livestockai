# Requirements: IoT Sensor Hub

## Overview

The IoT Sensor Hub enables real-time environmental monitoring for livestock structures through connected sensors. It provides threshold and trend-based alerting, historical data visualization, and correlation with batch performance metrics. The system supports HTTP webhooks and MQTT protocols, with offline buffering and backfill capabilities.

## Target Users

- **Small-to-medium farmers** with basic IoT hardware (ESP32, Arduino, Raspberry Pi)
- **Commercial operations** with professional sensor systems
- **DIY enthusiasts** who want affordable monitoring solutions

## User Stories

### 1. Sensor Registration & Management

#### 1.1 Register Sensor

As a farmer, I want to register a new sensor to my farm so that I can start receiving environmental data.

**Acceptance Criteria:**

- Can create sensor with name, type, and structure assignment
- Sensor types include: temperature, humidity, ammonia, dissolved_oxygen, ph, water_level, water_temperature, hive_weight, hive_temperature, hive_humidity
- Each sensor gets a unique API key for authentication
- Sensor can be assigned to a specific structure (pen, pond, hive, etc.)
- Can set custom polling interval (5min, 15min, 30min, 1hr)

#### 1.2 View Sensor List

As a farmer, I want to see all my sensors and their current status so that I can monitor my farm at a glance.

**Acceptance Criteria:**

- List shows sensor name, type, structure, last reading, and status
- Status indicators: 🟢 Online (data within 2x polling interval), 🟡 Stale (2-4x interval), 🔴 Offline (>4x interval)
- Can filter by structure, type, or status
- Can sort by name, last reading time, or status

#### 1.3 Edit Sensor

As a farmer, I want to update sensor configuration so that I can change its assignment or settings.

**Acceptance Criteria:**

- Can update name, structure assignment, polling interval
- Can regenerate API key (invalidates old key)
- Can enable/disable sensor without deleting

#### 1.4 Delete Sensor

As a farmer, I want to remove a sensor so that I can clean up decommissioned hardware.

**Acceptance Criteria:**

- Soft delete preserves historical data
- Confirmation dialog warns about data retention
- Can permanently delete sensor and all its data

### 2. Data Ingestion

#### 2.1 HTTP Webhook Endpoint

As a sensor device, I want to POST readings via HTTP so that I can send data without complex protocols.

**Acceptance Criteria:**

- Endpoint: `POST /api/sensors/readings`
- Authentication via API key in header (`X-Sensor-Key`)
- Accepts JSON payload with value, timestamp (optional), and metadata
- Returns 201 on success, 401 on invalid key, 400 on invalid payload
- Accepts batch uploads (array of readings) for backfill

#### 2.2 MQTT Support

As a sensor device, I want to publish readings via MQTT so that I can use standard IoT protocols.

**Acceptance Criteria:**

- MQTT broker endpoint provided (or integration with external broker)
- Topic format: `livestockai/{farm_id}/sensors/{sensor_id}/readings`
- Supports QoS 0 and 1
- Authentication via username (sensor_id) and password (api_key)

#### 2.3 Offline Backfill

As a sensor device, I want to upload buffered readings after reconnecting so that no data is lost during outages.

**Acceptance Criteria:**

- Accepts readings with timestamps up to 7 days old
- Rejects readings older than 7 days with warning
- Deduplicates readings with same sensor_id and timestamp
- Processes batch uploads of up to 1000 readings

#### 2.4 Data Validation

As the system, I want to validate incoming readings so that bad data doesn't pollute the database.

**Acceptance Criteria:**

- Validates value is within sensor type's expected range
- Temperature: -40°C to 100°C
- Humidity: 0% to 100%
- pH: 0 to 14
- Dissolved Oxygen: 0 to 20 mg/L
- Ammonia: 0 to 100 mg/L
- Out-of-range values flagged but still stored (with `is_anomaly` flag)

### 3. Alert System

#### 3.1 Threshold Alerts

As a farmer, I want to receive alerts when sensor values exceed thresholds so that I can respond to dangerous conditions.

**Acceptance Criteria:**

- Can set min/max thresholds per sensor
- Default thresholds provided per sensor type (e.g., poultry temp: 18-28°C)
- Alert triggered immediately when threshold crossed
- Alert includes sensor name, current value, threshold, and structure

#### 3.2 Trend Alerts

As a farmer, I want to receive alerts when values change rapidly so that I can catch problems before they become critical.

**Acceptance Criteria:**

- Can set rate-of-change threshold (e.g., "5°C in 1 hour")
- System calculates rolling rate from recent readings
- Alert triggered when rate exceeds threshold
- Alert includes current value, rate of change, and direction

#### 3.3 Alert Channels

As a farmer, I want to receive alerts through multiple channels so that I don't miss critical notifications.

**Acceptance Criteria:**

- In-app notifications (always enabled)
- SMS alerts for critical thresholds (uses existing SMS integration)
- Email alerts with detailed report (uses existing email integration)
- Can configure which channels for which alert severity

#### 3.4 Alert Cooldown

As a farmer, I want alerts to have a cooldown period so that I'm not spammed with repeated notifications.

**Acceptance Criteria:**

- Default cooldown: 30 minutes per sensor per alert type
- Configurable cooldown: 15min, 30min, 1hr, 2hr
- Cooldown resets when value returns to normal range
- Daily digest option for non-critical alerts

#### 3.5 Alert History

As a farmer, I want to see past alerts so that I can review patterns and incidents.

**Acceptance Criteria:**

- List of all alerts with timestamp, sensor, type, value, and resolution
- Filter by date range, sensor, severity, or status
- Mark alerts as acknowledged/resolved
- Export alert history to CSV

### 4. Data Visualization

#### 4.1 Current Readings Card

As a farmer, I want to see current sensor values at a glance so that I can quickly assess conditions.

**Acceptance Criteria:**

- Large, readable numbers with unit labels
- Color-coded status (🟢 normal, 🟡 warning, 🔴 critical)
- Shows time since last reading
- Grouped by structure on dashboard

#### 4.2 24-Hour Sparkline

As a farmer, I want to see a mini trend chart so that I can spot patterns without leaving the dashboard.

**Acceptance Criteria:**

- Compact sparkline showing last 24 hours
- Highlights min/max points
- Shows threshold lines if configured
- Tap to expand to full chart

#### 4.3 Historical Charts

As a farmer, I want to view detailed historical data so that I can analyze trends over time.

**Acceptance Criteria:**

- Line chart with configurable time range (24h, 7d, 30d, 90d)
- Zoom and pan functionality
- Overlay multiple sensors on same chart
- Show threshold lines and alert events
- Export data to CSV

#### 4.4 Mortality Correlation

As a farmer, I want to see sensor data overlaid with mortality events so that I can identify environmental causes.

**Acceptance Criteria:**

- Mortality events shown as markers on sensor charts
- Can filter to batches in the same structure
- Correlation analysis: "High mortality on days with temp > 35°C"
- Visual highlight of periods with abnormal readings

### 5. Structure Integration

#### 5.1 Structure Dashboard

As a farmer, I want to see all sensors for a structure so that I can monitor that location holistically.

**Acceptance Criteria:**

- Structure detail page shows all assigned sensors
- Current readings grid with status indicators
- Combined alert status (worst-status-wins)
- Quick link to batches in that structure

#### 5.2 Farm Overview

As a farmer, I want to see aggregate sensor status across my farm so that I can prioritize attention.

**Acceptance Criteria:**

- Farm dashboard shows structure cards with sensor status
- Color-coded by worst sensor status in each structure
- Click to drill down to structure detail
- Summary: "3 structures normal, 1 warning, 0 critical"

#### 5.3 Batch Correlation

As a farmer, I want sensor data linked to my batches so that I can analyze environmental impact on performance.

**Acceptance Criteria:**

- Batch detail page shows sensors from assigned structure
- Environmental summary: avg temp, humidity during batch lifecycle
- Correlation with FCR, mortality, growth rate
- "Environmental Score" metric for batch performance analysis

### 6. Data Retention & Storage

#### 6.1 Raw Data Retention

As the system, I want to manage data storage efficiently so that costs remain reasonable.

**Acceptance Criteria:**

- Raw readings retained for 90 days
- After 90 days, aggregate to hourly averages
- Hourly averages retained for 1 year
- After 1 year, aggregate to daily averages (retained indefinitely)

#### 6.2 Data Export

As a farmer, I want to export my sensor data so that I can use it in external tools.

**Acceptance Criteria:**

- Export raw readings for date range
- Export formats: CSV, JSON
- Include sensor metadata in export
- Bulk export for all sensors or selected sensors

### 7. Firmware & Documentation

#### 7.1 ESP32 Example Code

As a DIY farmer, I want example firmware so that I can build affordable sensors.

**Acceptance Criteria:**

- Arduino/PlatformIO code for ESP32 + DHT22 (temp/humidity)
- WiFi configuration via captive portal
- API key storage in EEPROM
- Offline buffering with SPIFFS
- OTA update support

#### 7.2 API Documentation

As a developer, I want clear API docs so that I can integrate custom sensors.

**Acceptance Criteria:**

- OpenAPI/Swagger specification
- Authentication examples
- Payload format documentation
- Error code reference
- Rate limiting documentation (100 requests/min per sensor)

### 8. Settings & Configuration

#### 8.1 Sensor Settings Page

As a farmer, I want a dedicated settings page for sensors so that I can manage all configurations.

**Acceptance Criteria:**

- List all sensors with quick status
- Bulk enable/disable sensors
- Default threshold configuration per sensor type
- Alert channel preferences
- Data retention preferences

#### 8.2 API Key Management

As a farmer, I want to manage API keys securely so that I can control sensor access.

**Acceptance Criteria:**

- View masked API keys (show last 4 characters)
- Regenerate key with confirmation
- Key usage statistics (last used, request count)
- Revoke key without deleting sensor

## Non-Functional Requirements

### Performance

- Ingest up to 1000 readings/minute per farm
- Dashboard loads in <2 seconds
- Chart rendering in <1 second for 90 days of data

### Reliability

- 99.9% uptime for ingestion endpoint
- No data loss during brief outages (<1 hour)
- Graceful degradation when database is slow

### Security

- API keys hashed in database (bcrypt)
- Rate limiting per sensor (100 req/min)
- Input sanitization for all payloads
- HTTPS required for all endpoints

### Scalability

- Support 100 sensors per farm
- Support 10,000 readings per sensor per day
- Efficient time-series queries with proper indexing

## Out of Scope (Future Phases)

- Actuator control (turning on fans, pumps)
- Camera/video integration
- Machine learning anomaly detection
- Multi-farm sensor sharing
- Third-party sensor marketplace
