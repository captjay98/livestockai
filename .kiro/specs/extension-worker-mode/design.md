# Design Document - Extension Worker Mode (v3 - Final)

## Overview

Extension Worker Mode enables government/NGO field agents to monitor farm health across their assigned districts through an OAuth-style consent model. The design follows OpenLivestock's three-layer architecture and integrates with existing systems.

**Key Design Decisions:**

1. **Extend FarmRole:** Add 'observer' to existing type (like Digital Foreman added 'worker')
2. **user_districts table:** District-level assignments separate from farm-level access
3. **access_grants table:** Time-limited consent with expiration
4. **Species-specific thresholds:** Stored in database, configurable per region
5. **Junction table for alerts:** Proper foreign keys instead of TEXT[]

## Database Schema

### Table 1: countries

```sql
CREATE TABLE countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  localized_names JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO countries (code, name) VALUES
  ('NG', 'Nigeria'), ('KE', 'Kenya'), ('IN', 'India'),
  ('BR', 'Brazil'), ('GH', 'Ghana'), ('TZ', 'Tanzania'),
  ('UG', 'Uganda'), ('ET', 'Ethiopia');
```

### Table 2: regions

```sql
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
  parent_id UUID REFERENCES regions(id) ON DELETE RESTRICT,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  localized_names JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_region_name UNIQUE (country_code, parent_id, name),
  CONSTRAINT unique_region_slug UNIQUE (slug)
);

CREATE INDEX idx_regions_country_level ON regions(country_code, level);
CREATE INDEX idx_regions_parent ON regions(parent_id);
CREATE INDEX idx_regions_active ON regions(is_active) WHERE is_active = true;
```

### Table 3: user_districts (District-Level Assignments)

```sql
CREATE TABLE user_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_supervisor BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT unique_user_district UNIQUE (user_id, district_id)
);

CREATE INDEX idx_user_districts_user ON user_districts(user_id);
CREATE INDEX idx_user_districts_district ON user_districts(district_id);
```

### Table 4: access_requests

```sql
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  requested_duration_days INTEGER DEFAULT 90 CHECK (requested_duration_days BETWEEN 30 AND 365),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  responder_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'), -- Auto-expire pending requests
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_access_requests_farm_status ON access_requests(farm_id, status);
CREATE INDEX idx_access_requests_requester ON access_requests(requester_id, status);
CREATE INDEX idx_access_requests_pending ON access_requests(status, expires_at) WHERE status = 'pending';
```

### Table 5: access_grants

```sql
CREATE TABLE access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  access_request_id UUID REFERENCES access_requests(id) ON DELETE SET NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  financial_visibility BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_reason TEXT,

  CONSTRAINT unique_active_grant UNIQUE (user_id, farm_id)
    DEFERRABLE INITIALLY DEFERRED
);

-- Partial unique index for active (non-revoked) grants only
-- Note: We only check revoked_at IS NULL, not expires_at > NOW()
-- because NOW() is evaluated at index creation time, not query time.
-- Expiration is checked at query time via idx_access_grants_check.
CREATE UNIQUE INDEX idx_active_access_grant
  ON access_grants(user_id, farm_id)
  WHERE revoked_at IS NULL;

-- Composite index for access check queries (covers the common WHERE clause)
CREATE INDEX idx_access_grants_check ON access_grants(user_id, farm_id, expires_at, revoked_at);

-- Index for expiration cron job
CREATE INDEX idx_access_grants_expiring ON access_grants(expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_access_grants_farm ON access_grants(farm_id);
```

### Table 6: visit_records

```sql
CREATE TABLE visit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_type VARCHAR(20) DEFAULT 'routine' CHECK (visit_type IN ('routine', 'emergency', 'follow_up')),
  findings TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  attachments JSONB, -- Array of {key, filename, contentType, uploadedAt}
  follow_up_date DATE,
  farmer_acknowledged BOOLEAN DEFAULT false,
  farmer_acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visit_records_farm ON visit_records(farm_id, visit_date DESC);
CREATE INDEX idx_visit_records_agent ON visit_records(agent_id, visit_date DESC);
CREATE INDEX idx_visit_records_follow_up ON visit_records(follow_up_date) WHERE follow_up_date IS NOT NULL;
```

### Table 7: outbreak_alerts

```sql
CREATE TABLE outbreak_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  species VARCHAR(50) NOT NULL,
  livestock_type VARCHAR(20) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('watch', 'alert', 'critical')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'false_positive')),
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_outbreak_alerts_district_status ON outbreak_alerts(district_id, status);
CREATE INDEX idx_outbreak_alerts_active ON outbreak_alerts(status) WHERE status = 'active';
```

### Table 8: outbreak_alert_farms (Junction Table)

```sql
CREATE TABLE outbreak_alert_farms (
  alert_id UUID NOT NULL REFERENCES outbreak_alerts(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  mortality_rate DECIMAL(5,2) NOT NULL,
  reported_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (alert_id, farm_id)
);

CREATE INDEX idx_outbreak_alert_farms_farm ON outbreak_alert_farms(farm_id);
```

### Table 9: species_thresholds

```sql
CREATE TABLE species_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species VARCHAR(50) NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE, -- NULL = global default
  amber_threshold DECIMAL(5,2) NOT NULL,
  red_threshold DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_species_region UNIQUE (species, region_id)
);

-- Seed global defaults
INSERT INTO species_thresholds (species, region_id, amber_threshold, red_threshold) VALUES
  ('broiler', NULL, 5.0, 10.0),
  ('layer', NULL, 3.0, 7.0),
  ('catfish', NULL, 12.0, 18.0),
  ('tilapia', NULL, 10.0, 15.0),
  ('cattle', NULL, 2.0, 5.0),
  ('goats', NULL, 3.0, 6.0),
  ('sheep', NULL, 3.0, 6.0);
```

### Modified Table: farms

```sql
ALTER TABLE farms ADD COLUMN district_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX idx_farms_district ON farms(district_id) WHERE district_id IS NOT NULL;

-- Trigger to validate district is level 2
CREATE OR REPLACE FUNCTION validate_farm_district() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.district_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM regions WHERE id = NEW.district_id AND level = 2) THEN
      RAISE EXCEPTION 'Farm district must be a level 2 region';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_farm_district
  BEFORE INSERT OR UPDATE OF district_id ON farms
  FOR EACH ROW EXECUTE FUNCTION validate_farm_district();

-- Trigger to revoke access grants when farm changes district (R3.4)
-- This ensures extension workers don't retain access to farms that moved out of their district
CREATE OR REPLACE FUNCTION revoke_grants_on_district_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.district_id IS DISTINCT FROM NEW.district_id THEN
    UPDATE access_grants
    SET revoked_at = NOW(),
        revoked_reason = 'Farm changed district'
    WHERE farm_id = NEW.id
      AND revoked_at IS NULL
      AND expires_at > NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revoke_grants_on_district_change
  AFTER UPDATE OF district_id ON farms
  FOR EACH ROW EXECUTE FUNCTION revoke_grants_on_district_change();
```

### Modified Type: FarmRole

**IMPORTANT:** FarmRole is defined in 3 locations - ALL must be updated:

```typescript
// 1. app/lib/db/types.ts (line 330) - Primary source
export type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

// 2. app/features/auth/utils.ts (line 305) - Re-export
export type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

// 3. app/features/users/repository.ts (line 37) - Local type
type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

// 4. app/features/farms/service.ts - Update validateFarmRole()
export function validateFarmRole(role: string): string | null {
  const validRoles = ['owner', 'manager', 'viewer', 'worker', 'observer'] // Add worker AND observer
  if (!validRoles.includes(role)) {
    return `Invalid role. Must be one of: ${validRoles.join(', ')}`
  }
  return null
}
```

**Why observer differs from worker:**

- `worker`: `['batch:read', 'finance:read']` - Farm employees need to see costs for purchasing
- `observer`: `['batch:read', 'farm:read']` - Extension agents should NOT see finances by default
- Financial visibility for observers is controlled separately via `access_grants.financialVisibility`

## TypeScript Types

```typescript
// Add to app/lib/db/types.ts

export interface CountryTable {
  code: string
  name: string
  localizedNames: Record<string, string>
  createdAt: Generated<Date>
}

export interface RegionTable {
  id: Generated<string>
  countryCode: string
  parentId: string | null
  level: 1 | 2
  name: string
  slug: string
  localizedNames: Record<string, string>
  isActive: Generated<boolean>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface UserDistrictTable {
  id: Generated<string>
  userId: string
  districtId: string
  isSupervisor: Generated<boolean>
  assignedAt: Generated<Date>
  assignedBy: string | null
}

export interface AccessRequestTable {
  id: Generated<string>
  requesterId: string
  farmId: string
  purpose: string
  requestedDurationDays: number
  status: 'pending' | 'approved' | 'denied' | 'expired'
  responderId: string | null
  rejectionReason: string | null
  respondedAt: Date | null
  expiresAt: Date // Auto-expire for pending requests
  createdAt: Generated<Date>
}

export interface AccessGrantTable {
  id: Generated<string>
  userId: string
  farmId: string
  accessRequestId: string | null
  grantedBy: string | null
  grantedAt: Generated<Date>
  expiresAt: Date
  financialVisibility: Generated<boolean>
  revokedAt: Date | null
  revokedBy: string | null
  revokedReason: string | null // Track why access was revoked
}

export interface VisitRecordTable {
  id: Generated<string>
  agentId: string
  farmId: string
  visitDate: Date
  visitType: 'routine' | 'emergency' | 'follow_up'
  findings: string
  recommendations: string
  attachments: Array<{
    key: string // Storage key
    filename: string // Original filename
    contentType: string
    uploadedAt: string // ISO date
  }> | null
  followUpDate: Date | null
  farmerAcknowledged: Generated<boolean>
  farmerAcknowledgedAt: Date | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface OutbreakAlertTable {
  id: Generated<string>
  districtId: string
  species: string // Specific: "broiler", "catfish", "angus"
  livestockType: string // General: "poultry", "fish", "cattle" (for filtering/grouping)
  severity: 'watch' | 'alert' | 'critical'
  status: 'active' | 'monitoring' | 'resolved' | 'false_positive'
  detectedAt: Generated<Date>
  resolvedAt: Date | null
  notes: string | null
  createdBy: string | null
  updatedAt: Generated<Date>
  updatedBy: string | null
}

export interface OutbreakAlertFarmTable {
  alertId: string
  farmId: string
  mortalityRate: string // DECIMAL
  reportedAt: Generated<Date>
}

export interface SpeciesThresholdTable {
  id: Generated<string>
  species: string
  regionId: string | null
  amberThreshold: string // DECIMAL
  redThreshold: string // DECIMAL
  createdAt: Generated<Date>
}

// Update FarmTable
export interface FarmTable {
  // ... existing fields
  districtId: string | null
}

// Update Database interface
export interface Database {
  // ... existing tables
  countries: CountryTable
  regions: RegionTable
  user_districts: UserDistrictTable
  access_requests: AccessRequestTable
  access_grants: AccessGrantTable
  visit_records: VisitRecordTable
  outbreak_alerts: OutbreakAlertTable
  outbreak_alert_farms: OutbreakAlertFarmTable
  species_thresholds: SpeciesThresholdTable
}
```

## Error Codes

**Note:** Error codes must not conflict with existing Marketplace (40432-40433, 40010-40011, 40904) or Digital Foreman (40903, 40905) codes.

```typescript
// Add to app/lib/errors/error-map.ts

// Extension Worker Mode - NOT_FOUND (404xx) - Start at 40434
REGION_NOT_FOUND: {
  code: 40434,
  httpStatus: 404,
  category: 'NOT_FOUND',
  message: 'Region not found',
},
ACCESS_REQUEST_NOT_FOUND: {
  code: 40435,
  httpStatus: 404,
  category: 'NOT_FOUND',
  message: 'Access request not found',
},
ACCESS_GRANT_NOT_FOUND: {
  code: 40436,
  httpStatus: 404,
  category: 'NOT_FOUND',
  message: 'Access grant not found',
},
VISIT_RECORD_NOT_FOUND: {
  code: 40437,
  httpStatus: 404,
  category: 'NOT_FOUND',
  message: 'Visit record not found',
},
OUTBREAK_ALERT_NOT_FOUND: {
  code: 40438,
  httpStatus: 404,
  category: 'NOT_FOUND',
  message: 'Outbreak alert not found',
},

// Extension Worker Mode - FORBIDDEN (403xx)
EXTENSION_ACCESS_DENIED: {
  code: 40330,
  httpStatus: 403,
  category: 'FORBIDDEN',
  message: 'Extension access not granted or expired',
},
NOT_DISTRICT_MEMBER: {
  code: 40331,
  httpStatus: 403,
  category: 'FORBIDDEN',
  message: 'User not assigned to this district',
},
FINANCIAL_DATA_HIDDEN: {
  code: 40332,
  httpStatus: 403,
  category: 'FORBIDDEN',
  message: 'Financial visibility not granted',
},

// Extension Worker Mode - VALIDATION (400xx) - Start at 40012
INVALID_DISTRICT_LEVEL: {
  code: 40012,
  httpStatus: 400,
  category: 'VALIDATION',
  message: 'District must be level 2 region',
},
ACCESS_ALREADY_GRANTED: {
  code: 40013,
  httpStatus: 400,
  category: 'VALIDATION',
  message: 'Active access grant already exists',
},
ACCESS_REQUEST_EXPIRED: {
  code: 40014,
  httpStatus: 400,
  category: 'VALIDATION',
  message: 'Access request has expired',
},
VISIT_EDIT_WINDOW_CLOSED: {
  code: 40015,
  httpStatus: 400,
  category: 'VALIDATION',
  message: 'Visit record can only be edited within 24 hours',
},
ACCESS_REQUEST_RATE_LIMITED: {
  code: 40016,
  httpStatus: 400,
  category: 'VALIDATION',
  message: 'Too many access requests. Try again tomorrow.',
},

// Extension Worker Mode - CONFLICT (409xx) - Start at 40906
REGION_HAS_CHILDREN: {
  code: 40906,
  httpStatus: 409,
  category: 'CONFLICT',
  message: 'Cannot delete region with child regions',
},
REGION_HAS_FARMS: {
  code: 40907,
  httpStatus: 409,
  category: 'CONFLICT',
  message: 'Cannot delete region with assigned farms',
},
```

## Service Layer

### Health Status Service (Species-Specific)

```typescript
// app/features/extension/health-service.ts

interface SpeciesThreshold {
  species: string
  amberThreshold: number
  redThreshold: number
}

// Default thresholds (fallback if not in DB)
const DEFAULT_THRESHOLDS: Record<string, { amber: number; red: number }> = {
  broiler: { amber: 5, red: 10 },
  layer: { amber: 3, red: 7 },
  catfish: { amber: 12, red: 18 },
  tilapia: { amber: 10, red: 15 },
  cattle: { amber: 2, red: 5 },
  goats: { amber: 3, red: 6 },
  sheep: { amber: 3, red: 6 },
}

export function calculateHealthStatus(
  mortalityRate: number,
  species: string,
  customThresholds?: SpeciesThreshold,
): 'green' | 'amber' | 'red' {
  const thresholds = customThresholds
    ? {
        amber: customThresholds.amberThreshold,
        red: customThresholds.redThreshold,
      }
    : DEFAULT_THRESHOLDS[species.toLowerCase()] || { amber: 5, red: 10 }

  if (mortalityRate > thresholds.red) return 'red'
  if (mortalityRate > thresholds.amber) return 'amber'
  return 'green'
}

export function calculateMortalityRate(
  initialQuantity: number,
  currentQuantity: number,
): number {
  if (initialQuantity === 0) return 0
  const deaths = initialQuantity - currentQuantity
  return Math.max(0, (deaths / initialQuantity) * 100)
}
```

### Outbreak Detection Service

```typescript
// app/features/extension/outbreak-service.ts

interface FarmMortalityData {
  farmId: string
  species: string
  livestockType: string
  districtId: string
  mortalityRate: number
  batchSize: number
  batchAgeDays: number
  hadRecentSale: boolean // true if farm has sales in last 7 days for this batch
  // This prevents false positives when farmers sell livestock
  // (reduced currentQuantity looks like mortality)
  reportedAt: Date
}

export function detectOutbreaks(
  mortalityData: FarmMortalityData[],
  thresholds: Map<string, number>, // species -> red threshold
  minFarms: number = 3,
  minBatchSize: number = 50,
  minBatchAge: number = 7,
  windowDays: number = 7,
): OutbreakPattern[] {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  // Filter to valid concerning farms
  const concerningFarms = mortalityData.filter((f) => {
    const threshold = thresholds.get(f.species.toLowerCase()) || 10
    return (
      f.mortalityRate > threshold &&
      f.reportedAt >= windowStart &&
      f.batchSize >= minBatchSize &&
      f.batchAgeDays >= minBatchAge &&
      !f.hadRecentSale
    )
  })

  // Group by district + species
  const clusters = new Map<string, FarmMortalityData[]>()
  for (const farm of concerningFarms) {
    const key = `${farm.districtId}-${farm.species.toLowerCase()}`
    if (!clusters.has(key)) clusters.set(key, [])
    clusters.get(key)!.push(farm)
  }

  // Create patterns for clusters with 3+ farms
  const patterns: OutbreakPattern[] = []
  for (const [_, farms] of clusters) {
    if (farms.length >= minFarms) {
      patterns.push({
        districtId: farms[0].districtId,
        species: farms[0].species,
        livestockType: farms[0].livestockType,
        affectedFarms: farms,
        severity: classifySeverity(farms.length),
      })
    }
  }

  return patterns
}

export function classifySeverity(
  farmCount: number,
): 'watch' | 'alert' | 'critical' {
  if (farmCount >= 10) return 'critical'
  if (farmCount >= 5) return 'alert'
  return 'watch'
}
```

## Server Functions

### District Dashboard (Optimized Query)

```typescript
// app/features/extension/server.ts

export const getDistrictDashboardFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      districtId: z.string().uuid(),
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().min(10).max(100).default(50),
      livestockType: z.string().optional(),
      healthStatus: z.enum(['green', 'amber', 'red']).optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()

    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // Verify user is assigned to district
    const assignment = await db
      .selectFrom('user_districts')
      .where('userId', '=', session.user.id)
      .where('districtId', '=', data.districtId)
      .executeTakeFirst()

    if (!assignment) {
      throw new AppError('NOT_DISTRICT_MEMBER')
    }

    // Single optimized query with CTEs
    const { sql } = await import('kysely')

    const farms = await db
      .with('farm_mortality', (qb) =>
        qb
          .selectFrom('batches')
          .select([
            'farmId',
            'species',
            'livestockType',
            sql<number>`SUM(initial_quantity)`.as('totalInitial'),
            sql<number>`SUM(current_quantity)`.as('totalCurrent'),
            sql<number>`COUNT(*)`.as('batchCount'),
          ])
          .where('status', '=', 'active')
          .groupBy(['farmId', 'species', 'livestockType']),
      )
      .with(
        'thresholds',
        (qb) =>
          qb
            .selectFrom('species_thresholds')
            .select(['species', 'amberThreshold', 'redThreshold'])
            .where('regionId', 'is', null), // Global defaults
      )
      .selectFrom('farms')
      .innerJoin('access_grants', 'access_grants.farmId', 'farms.id')
      .leftJoin('farm_mortality', 'farm_mortality.farmId', 'farms.id')
      .leftJoin(
        'thresholds',
        sql`LOWER(thresholds.species) = LOWER(farm_mortality.species)`,
      )
      .select([
        'farms.id',
        'farms.name',
        'farms.location',
        'farm_mortality.species',
        'farm_mortality.livestockType',
        'farm_mortality.totalInitial',
        'farm_mortality.totalCurrent',
        'farm_mortality.batchCount',
        'thresholds.amberThreshold',
        'thresholds.redThreshold',
        'access_grants.financialVisibility',
      ])
      .where('farms.districtId', '=', data.districtId)
      .where('access_grants.userId', '=', session.user.id)
      .where('access_grants.expiresAt', '>', new Date())
      .where('access_grants.revokedAt', 'is', null)
      .orderBy('farms.name')
      .limit(data.pageSize)
      .offset((data.page - 1) * data.pageSize)
      .execute()

    // Calculate health status for each farm
    const { calculateHealthStatus, calculateMortalityRate } =
      await import('./health-service')

    const farmsWithHealth = farms.map((farm) => {
      const mortalityRate = calculateMortalityRate(
        Number(farm.totalInitial || 0),
        Number(farm.totalCurrent || 0),
      )
      const healthStatus = calculateHealthStatus(
        mortalityRate,
        farm.species || 'broiler',
        farm.amberThreshold && farm.redThreshold
          ? {
              species: farm.species!,
              amberThreshold: Number(farm.amberThreshold),
              redThreshold: Number(farm.redThreshold),
            }
          : undefined,
      )

      return {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        species: farm.species,
        livestockType: farm.livestockType,
        batchCount: Number(farm.batchCount || 0),
        totalLivestock: Number(farm.totalCurrent || 0),
        mortalityRate,
        healthStatus,
        financialVisibility: farm.financialVisibility,
      }
    })

    // Sort by urgency (red first)
    const sortOrder = { red: 0, amber: 1, green: 2 }
    farmsWithHealth.sort(
      (a, b) => sortOrder[a.healthStatus] - sortOrder[b.healthStatus],
    )

    return { farms: farmsWithHealth }
  })
```

## Notification Types

```typescript
// Update app/features/notifications/types.ts

export type NotificationType =
  // Existing types
  | 'lowStock'
  | 'highMortality'
  | 'invoiceDue'
  | 'batchHarvest'
  | 'taskAssigned'
  | 'taskCompleted'
  | 'taskApproved'
  | 'taskRejected'
  | 'flaggedCheckIn'
  // Extension Worker Mode - NEW
  | 'accessRequest' // Farmer receives access request from agent
  | 'accessGranted' // Agent receives approval notification
  | 'accessDenied' // Agent receives denial notification
  | 'accessExpiring' // Both parties, 7 days before expiration
  | 'accessExpired' // Both parties, when grant expires
  | 'outbreakAlert' // Agent receives outbreak alert for their district
  | 'visitRecordCreated' // Farmer receives notification of new visit record
```

## File Storage

Visit record attachments use the existing storage abstraction layer (`app/features/integrations/storage/`):

```typescript
// Use existing storage service - NOT hardcoded R2
import {
  uploadFile,
  getSignedUrl,
  deleteFile,
} from '~/features/integrations/storage'

// Upload attachment
const result = await uploadFile(
  `visit-records/${visitId}/${filename}`,
  fileBuffer,
  contentType,
  { access: 'private', metadata: { visitId, agentId } },
)

// Get signed URL for viewing (1-hour expiration)
const url = await getSignedUrl(`visit-records/${visitId}/${filename}`, 3600)
```

**Storage Configuration:**

- Provider: Configured via `STORAGE_PROVIDER` env var (r2, s3, local)
- Bucket: Uses `PRIVATE_STORAGE_BUCKET` binding (not hardcoded)
- Path convention: `visit-records/{visitId}/{filename}`
- Max size: 5MB per file
- Allowed types: image/jpeg, image/png, application/pdf

## Configurable Settings

These values should be stored in a `extension_settings` table or environment variables for flexibility:

| Setting                       | Default  | Env Var                      | Description                           |
| ----------------------------- | -------- | ---------------------------- | ------------------------------------- |
| Visit edit window             | 24 hours | `VISIT_EDIT_WINDOW_HOURS`    | Time window for editing visit records |
| Outbreak detection interval   | 6 hours  | Cron config                  | Background job frequency              |
| Access request expiration     | 30 days  | `ACCESS_REQUEST_EXPIRY_DAYS` | Auto-expire pending requests          |
| Access grant default duration | 90 days  | `ACCESS_GRANT_DEFAULT_DAYS`  | Default grant duration                |
| Expiration warning days       | 7 days   | `ACCESS_EXPIRY_WARNING_DAYS` | Days before expiry to warn            |

```typescript
// app/features/extension/constants.ts
export const EXTENSION_DEFAULTS = {
  VISIT_EDIT_WINDOW_HOURS: Number(process.env.VISIT_EDIT_WINDOW_HOURS) || 24,
  ACCESS_REQUEST_EXPIRY_DAYS:
    Number(process.env.ACCESS_REQUEST_EXPIRY_DAYS) || 30,
  ACCESS_GRANT_DEFAULT_DAYS:
    Number(process.env.ACCESS_GRANT_DEFAULT_DAYS) || 90,
  ACCESS_EXPIRY_WARNING_DAYS:
    Number(process.env.ACCESS_EXPIRY_WARNING_DAYS) || 7,
} as const
```

## Background Jobs

```typescript
// Cloudflare Workers Cron Triggers
// Configure in wrangler.jsonc:
// "triggers": { "crons": ["0 */6 * * *", "0 0 * * *", "0 9 * * *"] }

// Handler in app/worker.ts or dedicated scheduled handler:
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    switch (event.cron) {
      case '0 */6 * * *':
        await detectOutbreaks(env)
        break
      case '0 0 * * *':
        await expireAccessGrants(env)
        await expireAccessRequests(env) // NEW: expire pending requests after 30 days
        break
      case '0 9 * * *':
        await sendExpirationWarnings(env)
        break
    }
  },
}

// 1. Expire access grants (daily at midnight UTC)
async function expireAccessGrants(env: Env) {
  // Find expired grants, update status, notify both parties
}

// 2. Expire pending access requests (daily at midnight UTC)
async function expireAccessRequests(env: Env) {
  // Find requests where status='pending' AND expires_at < NOW()
  // Update status to 'expired', notify requester
}

// 3. Send expiration warnings (daily at 9am UTC)
async function sendExpirationWarnings(env: Env) {
  // Find grants expiring in 7 days, send notifications
}

// 4. Outbreak detection (every 6 hours)
async function detectOutbreaks(env: Env) {
  // Run detection algorithm, create alerts, notify agents
}
```

**Note:** TanStack Start on Cloudflare Workers requires a separate scheduled handler export. The cron triggers must be configured in wrangler.jsonc.

**Integration with TanStack Start:**
Create `app/features/extension/scheduled.ts` with the handler functions. The scheduled export must be added to the worker entry point. If TanStack Start doesn't support scheduled handlers directly, create a separate `scheduled-worker.ts` that imports the functions.

```typescript
// app/features/extension/scheduled.ts
export async function handleScheduled(event: ScheduledEvent, env: Env) {
  switch (event.cron) {
    case '0 */6 * * *':
      await detectOutbreaks(env)
      break
    case '0 0 * * *':
      await expireAccessGrants(env)
      await expireAccessRequests(env)
      break
    case '0 9 * * *':
      await sendExpirationWarnings(env)
      break
  }
}
```

**Event-Driven Detection (Future Enhancement):**
For critical/fast-spreading outbreaks, consider adding real-time detection triggered by mortality record creation. This would supplement the 6-hour cron for immediate alerts when mortality exceeds critical thresholds.

## Integration Points

| System         | Integration                                                                |
| -------------- | -------------------------------------------------------------------------- |
| auth/utils.ts  | Add 'observer' to FarmRole, ROLE_PERMISSIONS, create checkObserverAccess() |
| user_farms     | Observer role uses access_grants table, NOT user_farms                     |
| notifications  | 7 new notification types                                                   |
| audit_logs     | Log all extension worker actions                                           |
| batches        | Read mortality data for health status                                      |
| farms          | Add district_id column                                                     |
| Cloudflare R2  | Store visit attachments in PRIVATE_STORAGE_BUCKET                          |
| wrangler.jsonc | Add cron triggers for background jobs                                      |

## Auth System Changes

### checkObserverAccess Function

```typescript
// app/features/auth/utils.ts - NEW FUNCTION

/**
 * Check if user has observer access to a farm via access_grants.
 * This is SEPARATE from checkFarmAccess which uses user_farms.
 *
 * @returns Object with access status and financial visibility flag
 */
export async function checkObserverAccess(
  userId: string,
  farmId: string,
): Promise<{ hasAccess: boolean; financialVisibility: boolean }> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  const grant = await db
    .selectFrom('access_grants')
    .select(['financialVisibility'])
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .where('expiresAt', '>', new Date())
    .where('revokedAt', 'is', null)
    .executeTakeFirst()

  return {
    hasAccess: !!grant,
    financialVisibility: grant?.financialVisibility ?? false,
  }
}

/**
 * Get full observer grant details (for when you need more than just access check)
 */
export async function getObserverGrant(
  userId: string,
  farmId: string,
): Promise<AccessGrant | null> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  return (
    db
      .selectFrom('access_grants')
      .selectAll()
      .where('userId', '=', userId)
      .where('farmId', '=', farmId)
      .where('expiresAt', '>', new Date())
      .where('revokedAt', 'is', null)
      .executeTakeFirst() ?? null
  )
}
```

### getUserPermissions Update

```typescript
// app/features/auth/utils.ts - MODIFY EXISTING FUNCTION

export async function getUserPermissions(
  userId: string,
  farmId: string,
): Promise<Array<Permission>> {
  const { getDb } = await import('~/lib/db')
  const db = await getDb()

  // Check if admin
  const user = await db
    .selectFrom('users')
    .select(['role'])
    .where('id', '=', userId)
    .executeTakeFirst()

  if (!user) return []
  if (user.role === 'admin') return ROLE_PERMISSIONS.owner

  // Check user_farms first (owner, manager, viewer, worker)
  const farmRole = await db
    .selectFrom('user_farms')
    .select(['role'])
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .executeTakeFirst()

  if (farmRole) {
    return ROLE_PERMISSIONS[farmRole.role]
  }

  // Check access_grants for observer role
  const grant = await db
    .selectFrom('access_grants')
    .select(['financialVisibility'])
    .where('userId', '=', userId)
    .where('farmId', '=', farmId)
    .where('expiresAt', '>', new Date())
    .where('revokedAt', 'is', null)
    .executeTakeFirst()

  if (grant) {
    const permissions = [...ROLE_PERMISSIONS.observer]
    if (grant.financialVisibility) {
      permissions.push('finance:read')
    }
    return permissions
  }

  return []
}
```

### ROLE_PERMISSIONS Update

```typescript
// app/features/auth/utils.ts - ADD TO EXISTING

const ROLE_PERMISSIONS: Record<FarmRole, Array<Permission>> = {
  // ... existing roles (owner, manager, viewer, worker)
  observer: ['batch:read', 'farm:read'], // NO finance:read - controlled by financialVisibility grant flag
}
```

## Cloudflare Cron Configuration

```jsonc
// wrangler.jsonc - ADD THIS SECTION

"triggers": {
  "crons": [
    "0 */6 * * *",  // Outbreak detection - every 6 hours
    "0 0 * * *",    // Access grant expiration - daily midnight UTC
    "0 9 * * *"     // Expiration warnings - daily 9am UTC
  ]
}
```

## Performance Considerations

1. **District Dashboard:** Single CTE query instead of N+1
2. **Access Check:** Indexed on (user_id, farm_id, expires_at)
3. **Outbreak Detection:** Runs on schedule, not per-request
4. **Health Status:** Calculated on-demand, not stored
5. **Pagination:** 50 farms per page default
