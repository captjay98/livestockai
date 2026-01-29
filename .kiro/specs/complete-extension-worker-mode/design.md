# Design Document - Complete Extension Worker Mode Implementation

## Overview

This design document outlines the technical approach for completing Extension Worker Mode - a B2G (Business-to-Government) feature enabling agricultural extension services to monitor farm health across districts. The infrastructure (database, repositories, services, background jobs) is 100% complete. This implementation focuses on:

1. **Marketing Integration** - Making the feature visible on landing pages
2. **Server Function Implementation** - Replacing stub data with real database queries
3. **UI Completion** - Wiring existing routes and adding missing components
4. **Admin Tools** - District assignment, region management, threshold configuration
5. **Testing** - Property-based and integration tests

## Architecture

### Existing Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Server Functions                          │
│  (Auth, Validation, Orchestration - NEEDS IMPLEMENTATION)        │
├─────────────────────────────────────────────────────────────────┤
│                        Service Layer                             │
│  (Pure Business Logic - 100% COMPLETE)                          │
│  • health-service.ts - Mortality calculation, health status      │
│  • access-service.ts - Access validation, expiration logic       │
│  • outbreak-service.ts - Outbreak detection, severity            │
│  • service.ts - District membership, farm ownership              │
├─────────────────────────────────────────────────────────────────┤
│                       Repository Layer                           │
│  (Database Operations - 100% COMPLETE)                          │
│  • access-repository.ts - 11 functions                          │
│  • regions-repository.ts - 9 functions                          │
│  • user-districts-repository.ts - 5 functions                   │
│  • visit-repository.ts - 6 functions                            │
│  • outbreak-repository.ts - 6 functions                         │
│  • repository.ts - Re-exports + getDistrictDashboard            │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Landing    │     │  Extension   │     │    Admin     │
│    Pages     │     │    Routes    │     │    Routes    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │                    ▼                    │
       │            ┌──────────────┐             │
       │            │   Server     │             │
       │            │  Functions   │◄────────────┘
       │            └──────┬───────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │   Service    │
       │            │    Layer     │
       │            └──────┬───────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │  Repository  │
       │            │    Layer     │
       │            └──────┬───────┘
       │                   │
       ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                    PostgreSQL (Neon)                      │
│  9 Tables: countries, regions, user_districts,           │
│  access_requests, access_grants, visit_records,          │
│  outbreak_alerts, outbreak_alert_farms, species_thresholds│
└──────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Phase 1: Marketing Components

#### 1.1 FeaturesSection Update

Add Extension Worker Mode card to existing features array:

```typescript
// Position: After "Multi-Species Mastery" (index 1)
{
  title: 'Government & NGO Support',
  description: 'Multi-farm oversight, outbreak detection, and digital visit records for agricultural extension services.',
  icon: Shield,
  accent: 'emerald',
  code: 'EXT-02',
}
```

#### 1.2 ExtensionSection Component

New landing page section targeting government/NGO users:

```typescript
interface ExtensionBenefit {
  title: string
  description: string
  icon: LucideIcon
}

const benefits: ExtensionBenefit[] = [
  { title: 'District Dashboard', icon: LayoutGrid, description: '...' },
  { title: 'Outbreak Detection', icon: AlertTriangle, description: '...' },
  { title: 'Digital Visit Records', icon: FileText, description: '...' },
  { title: 'Privacy-First Access', icon: Shield, description: '...' },
]
```

#### 1.3 PricingCards Update

Add Government/NGO tier:

```typescript
{
  name: 'Government',
  code: 'GOV-05',
  price: { USD: 'Custom', NGN: 'Custom' },
  description: 'For Government & NGO extension services.',
  icon: Building2,
  accent: 'purple',
  features: [
    'Unlimited extension workers',
    'Multi-district management',
    'Outbreak detection & alerts',
    'Digital visit records',
    'Priority support',
    'Custom training',
    'SLA guarantees',
    'Dedicated account manager',
  ],
  cta: 'Contact Sales',
  href: '/support',
  popular: false,
  badge: 'For Government & NGOs',
}
```

### Phase 2: Server Functions

#### 2.1 getDistrictDashboardFn

```typescript
interface DistrictDashboardResponse {
  district: { id: string; name: string }
  stats: {
    totalFarms: number
    healthyFarms: number
    warningFarms: number
    criticalFarms: number
    activeAlerts: number
  }
  farms: Array<{
    id: string
    name: string
    ownerName: string
    location: string
    batchCount: number
    healthStatus: 'green' | 'amber' | 'red'
    mortalityRate: number
    lastVisit: string | null
  }>
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}
```

Implementation approach:

1. Validate user has district access via `getUserDistricts()`
2. Query farms with active access grants using `getDistrictDashboard()`
3. Calculate health status for each farm using `calculateHealthStatus()`
4. Apply filters (livestockType, healthStatus, search)
5. Return paginated results

#### 2.2 getSupervisorDashboardFn

```typescript
interface SupervisorDashboardResponse {
  districts: Array<{
    id: string
    name: string
    totalFarms: number
    healthyFarms: number
    warningFarms: number
    criticalFarms: number
    activeAlerts: number
    extensionWorkers: number
  }>
  totalDistricts: number
  totalFarms: number
  totalAlerts: number
}
```

#### 2.3 Access Management Functions

```typescript
// getAccessRequestsFn
interface AccessRequestsResponse {
  pendingRequests: Array<{
    id: string
    requesterName: string
    requesterEmail: string
    purpose: string
    requestedDurationDays: number
    createdAt: Date
  }>
  activeGrants: Array<{
    id: string
    agentName: string
    agentEmail: string
    grantedAt: Date
    expiresAt: Date
    financialVisibility: boolean
  }>
}

// respondToAccessRequestFn
interface RespondToAccessRequest {
  requestId: string
  approved: boolean
  financialVisibility?: boolean
  durationDays?: number
  reason?: string
}

// revokeAccessFn
interface RevokeAccess {
  grantId: string
  reason?: string
}
```

### Phase 3: UI Components

#### 3.1 Access Requests Card (Farmer Side)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔐 Access Requests                                    [Refresh] │
├─────────────────────────────────────────────────────────────────┤
│ PENDING REQUESTS (2)                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ John Doe (john@gov.ng)                           Jan 15     │ │
│ │ Purpose: Routine health inspection                          │ │
│ │ Duration: 90 days                                           │ │
│ │                                    [Deny]  [Approve ▼]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ACTIVE GRANTS (3)                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Jane Smith (jane@ngo.org)                                   │ │
│ │ Granted: Jan 10  •  Expires: Apr 10  •  💰 Financial: Yes   │ │
│ │                                              [Revoke]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 Visit History Card (Farmer Side)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Extension Worker Visits                                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔴 UNACKNOWLEDGED                              Jan 20, 2026 │ │
│ │ Agent: John Doe  •  Type: Routine                           │ │
│ │ Findings: Observed mild respiratory symptoms in Batch A...  │ │
│ │ Recommendations: Increase ventilation, monitor for 48hrs... │ │
│ │ Follow-up: Jan 27, 2026                                     │ │
│ │ 📎 2 attachments                                            │ │
│ │                                    [View Details] [Ack ✓]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3 Alert Card Component

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL                                        Jan 18, 2026 │
│ Broiler Mortality Spike - Kano District                         │
│ 5 farms affected  •  Avg mortality: 12.3%                       │
│                                              [View Details →]   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Admin Components

#### 4.1 District Assignment Table

```
┌─────────────────────────────────────────────────────────────────┐
│ Extension Worker Assignments                        [+ Assign]  │
├─────────────────────────────────────────────────────────────────┤
│ Search: [________________] District: [All Districts ▼]          │
├─────────────────────────────────────────────────────────────────┤
│ User              │ Email           │ Districts    │ Supervisor │
├───────────────────┼─────────────────┼──────────────┼────────────┤
│ John Doe          │ john@gov.ng     │ Kano, Lagos  │ ✓ Kano     │
│ Jane Smith        │ jane@ngo.org    │ Abuja        │            │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Region Tree View

```
┌─────────────────────────────────────────────────────────────────┐
│ Region Management                                   [+ Country] │
├─────────────────────────────────────────────────────────────────┤
│ 🇳🇬 Nigeria                                                     │
│   ├─ North West                                    [+ District] │
│   │   ├─ Kano (45 farms, 3 agents)                    [Edit]   │
│   │   ├─ Kaduna (23 farms, 2 agents)                  [Edit]   │
│   │   └─ Sokoto (12 farms, 1 agent)                   [Edit]   │
│   ├─ South West                                    [+ District] │
│   │   ├─ Lagos (67 farms, 5 agents)                   [Edit]   │
│   │   └─ Ogun (34 farms, 2 agents)                    [Edit]   │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 Threshold Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ Species Mortality Thresholds                                    │
├─────────────────────────────────────────────────────────────────┤
│ Species   │ Amber (%)  │ Red (%)   │ Region Override │ Actions  │
├───────────┼────────────┼───────────┼─────────────────┼──────────┤
│ Broiler   │ 5.0        │ 10.0      │ -               │ [Edit]   │
│ Layer     │ 3.0        │ 7.0       │ -               │ [Edit]   │
│ Catfish   │ 12.0       │ 18.0      │ Lagos: 10/15    │ [Edit]   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Existing Database Schema (Complete)

All 9 tables are fully implemented with proper indexes and foreign keys:

```sql
-- Core geographic hierarchy
countries (id, code, name, localizedNames)
regions (id, countryId, parentId, level, name, slug, isActive)

-- Extension worker assignments
user_districts (id, userId, districtId, isSupervisor, assignedAt, assignedBy)

-- Access control
access_requests (id, requesterId, farmId, purpose, requestedDurationDays, status, ...)
access_grants (id, userId, farmId, accessRequestId, grantedBy, expiresAt, financialVisibility, ...)

-- Visit records
visit_records (id, agentId, farmId, visitDate, visitType, findings, recommendations, attachments, ...)

-- Outbreak monitoring
outbreak_alerts (id, districtId, species, severity, status, detectedAt, ...)
outbreak_alert_farms (alertId, farmId, mortalityRate, reportedAt)

-- Configuration
species_thresholds (id, species, regionId, amberThreshold, redThreshold)
```

### TypeScript Interfaces (Complete)

All interfaces defined in `app/lib/db/types/extension-worker.ts`:

- `CountryTable`, `RegionTable`, `UserDistrictTable`
- `AccessRequestTable`, `AccessGrantTable`
- `VisitRecordTable`, `OutbreakAlertTable`, `OutbreakAlertFarmTable`
- `SpeciesThresholdTable`

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Mortality Rate Calculation

_For any_ initial quantity > 0 and current quantity <= initial quantity, the mortality rate should equal `(initial - current) / initial * 100`.

**Validates: Requirements 5.1 (health status calculation)**

### Property 2: Health Status Classification

_For any_ mortality rate and species thresholds (default or custom), the health status should be:

- 'red' if mortality rate >= red threshold
- 'amber' if mortality rate >= amber threshold and < red threshold
- 'green' if mortality rate < amber threshold

Custom thresholds override defaults when provided.

**Validates: Requirements 5.1, 17.1**

### Property 3: Access Expiration Calculation

_For any_ positive duration in days, the calculated expiration date should be exactly `duration` days in the future from the current date.

**Validates: Requirements 5.5, 17.3**

### Property 4: Access Active Status

_For any_ access grant:

- If `revokedAt` is set, `isAccessActive` returns false
- If `expiresAt` is in the past, `isAccessActive` returns false
- Otherwise, `isAccessActive` returns true

**Validates: Requirements 5.4, 5.6, 17.3**

### Property 5: Edit Window Calculation

_For any_ creation timestamp and window hours, `isWithinEditWindow` returns true if and only if the current time minus creation time is less than or equal to window hours in milliseconds.

**Validates: Requirements 9.9, 17.3**

### Property 6: Access Request Validation

_For any_ user with an existing pending request for a farm, attempting to create another request for the same farm should return an error.

**Validates: Requirements 5.4, 17.4**

### Property 7: Outbreak Clustering

_For any_ set of farms with high mortality, outbreak detection should only cluster farms that share the same district AND species. Farms in different districts or with different species should not be in the same outbreak alert.

**Validates: Requirements 5.7, 17.2**

### Property 8: Outbreak Severity Classification

_For any_ outbreak alert:

- 'critical' if affected farm count >= 5 OR average mortality >= red threshold
- 'alert' if affected farm count >= 3
- 'watch' otherwise

**Validates: Requirements 11.3, 17.2**

### Property 9: District Dashboard Pagination Invariant

_For any_ district dashboard query with pagination, the sum of items across all pages should equal the total items count. No item should appear on multiple pages.

**Validates: Requirements 5.1, 7.9**

### Property 10: Supervisor Aggregation Invariant

_For any_ supervisor dashboard, the total farms count should equal the sum of farms across all supervised districts. The total alerts count should equal the sum of active alerts across all districts.

**Validates: Requirements 5.2, 12.6**

## Error Handling

### Server Function Errors

All server functions use the existing `AppError` pattern:

```typescript
import { AppError } from '~/lib/errors'

// Authentication errors
throw new AppError('UNAUTHORIZED', 'You must be logged in')

// Authorization errors
throw new AppError('FORBIDDEN', 'You do not have access to this district')

// Validation errors
throw new AppError('VALIDATION_ERROR', 'Invalid request data')

// Not found errors
throw new AppError('NOT_FOUND', 'Farm not found')
```

### Error States in UI

Each component handles errors gracefully:

1. **Network errors**: Show retry button with offline indicator
2. **Authorization errors**: Redirect to appropriate page with message
3. **Validation errors**: Show inline field errors
4. **Not found errors**: Show empty state with helpful message

### Audit Logging

All state-changing operations log to `audit_logs`:

```typescript
await db.insertInto('audit_logs').values({
  userId: session.userId,
  action: 'access_grant_created',
  entityType: 'access_grant',
  entityId: grantId,
  details: JSON.stringify({ farmId, duration, financialVisibility }),
})
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit/property tests and integration tests:

1. **Property-Based Tests** (fast-check): Verify universal properties across all inputs
2. **Integration Tests**: Verify database operations and workflows
3. **Unit Tests**: Verify specific examples and edge cases

### Property-Based Testing Configuration

- **Library**: fast-check (already in project)
- **Minimum iterations**: 100 per property
- **Tag format**: `Feature: complete-extension-worker-mode, Property N: {property_text}`

### Test File Structure

```
tests/features/extension/
├── health-service.property.test.ts    # Properties 1, 2
├── access-service.property.test.ts    # Properties 3, 4, 5, 6
├── outbreak-service.property.test.ts  # Properties 7, 8
├── dashboard.property.test.ts         # Properties 9, 10
├── access-workflow.integration.test.ts
├── district-dashboard.integration.test.ts
└── visit-records.integration.test.ts
```

### Property Test Examples

```typescript
// Property 1: Mortality rate calculation
describe('calculateMortalityRate', () => {
  it('should calculate correct mortality rate for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (initial, current) => {
          fc.pre(current <= initial)
          const rate = calculateMortalityRate(initial, current)
          const expected = ((initial - current) / initial) * 100
          return Math.abs(rate - expected) < 0.0001
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Property 2: Health status classification
describe('calculateHealthStatus', () => {
  it('should classify health status correctly for all mortality rates', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.constantFrom(
          'broiler',
          'layer',
          'catfish',
          'tilapia',
          'cattle',
          'goats',
          'sheep',
        ),
        (mortalityRate, species) => {
          const status = calculateHealthStatus(mortalityRate, species)
          const thresholds = DEFAULT_THRESHOLDS[species]

          if (mortalityRate >= thresholds.red) return status === 'red'
          if (mortalityRate >= thresholds.amber) return status === 'amber'
          return status === 'green'
        },
      ),
      { numRuns: 100 },
    )
  })
})
```

### Integration Test Examples

```typescript
// Access workflow integration test
describe('Access Request Workflow', () => {
  beforeEach(async () => {
    await truncateAllTables()
  })

  afterEach(() => {
    resetTestDb()
  })

  afterAll(async () => {
    await closeTestDb()
  })

  it('should create grant when request is approved', async () => {
    // Setup
    const { userId: farmerId } = await seedTestUser({
      email: `farmer-${Date.now()}@test.com`,
    })
    const { userId: agentId } = await seedTestUser({
      email: `agent-${Date.now()}@test.com`,
    })
    const { farmId } = await seedTestFarm(farmerId)

    // Create request
    const request = await createAccessRequest(db, {
      requesterId: agentId,
      farmId,
      purpose: 'Routine inspection',
      requestedDurationDays: 90,
    })

    // Approve request
    await respondToAccessRequest(db, request.id, {
      approved: true,
      responderId: farmerId,
      financialVisibility: false,
    })

    // Verify grant exists
    const grant = await getActiveAccessGrant(db, agentId, farmId)
    expect(grant).toBeDefined()
    expect(grant?.financialVisibility).toBe(false)
  })
})
```

## Implementation Notes

### Server Function Pattern

All server functions follow this pattern:

```typescript
export const myServerFn = createServerFn({ method: 'POST' })
  .inputValidator(zodSchema)
  .handler(async ({ data }) => {
    // 1. Auth
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    // 2. Authorization (if needed)
    const hasAccess = await checkDistrictAccess(session.userId, data.districtId)
    if (!hasAccess) throw new AppError('FORBIDDEN', 'No district access')

    // 3. Database
    const { getDb } = await import('~/lib/db')
    const db = await getDb()

    // 4. Business logic (use service layer)
    const result = await someRepositoryFunction(db, data)

    // 5. Audit log (for mutations)
    await logAuditEvent(db, session.userId, 'action', result.id)

    return result
  })
```

### Component Pattern

All components follow the existing UI standards:

- 48px minimum touch targets
- Mobile-first responsive design
- Skeleton loaders for loading states
- Error boundaries with retry options
- Offline indicators where applicable

### File Upload Pattern (Visit Attachments)

```typescript
// Use existing storage abstraction
import { uploadFile } from '~/lib/storage'

const handleAttachment = async (file: File) => {
  // Validate
  if (file.size > VISIT_ATTACHMENT.MAX_SIZE_BYTES) {
    throw new Error('File too large (max 5MB)')
  }
  if (!VISIT_ATTACHMENT.ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // Upload
  const url = await uploadFile(file, VISIT_ATTACHMENT.PATH_PREFIX)
  return { name: file.name, url, type: file.type, size: file.size }
}
```

## Dependencies

### Existing Dependencies (No Changes)

- TanStack Start (server functions)
- TanStack Router (routes)
- Kysely (database)
- Zod (validation)
- fast-check (property testing)
- Lucide React (icons)
- shadcn/ui components

### New Dependencies

None required - all functionality can be built with existing dependencies.

## Migration Notes

No database migrations needed - all 9 tables are already created and indexed.

## Security Considerations

1. **Access Control**: All server functions verify user has appropriate district/farm access
2. **Financial Data**: Only visible when `financialVisibility` is true on access grant
3. **Rate Limiting**: Query rate limiter already implemented (100 queries/user/day)
4. **Audit Trail**: All mutations logged to audit_logs table
5. **Input Validation**: All inputs validated with Zod schemas
