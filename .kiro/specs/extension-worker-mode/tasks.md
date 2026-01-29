# Implementation Plan - Extension Worker Mode (v3 - Final)

## Overview

This plan implements Extension Worker Mode in 4 phases over 8 weeks, following the patterns established by Digital Foreman and IoT Sensor Hub.

**Key Patterns from Codebase:**

- Three-layer architecture (Server → Service → Repository)
- FarmRole extension (like 'worker' in Digital Foreman)
- Dynamic imports for Cloudflare Workers
- Property-based testing with fast-check
- Zod validation on all server functions

## Phase 1: Foundation & Access Control (Weeks 1-2)

### Week 1: Database & Core Types

- [ ] 1.1 Create migration: countries and regions tables
  - countries table with ISO codes
  - regions table with 2-level hierarchy
  - Unique constraints, indexes
  - Seed countries data

- [ ] 1.2 Create migration: user_districts table
  - District-level assignments
  - is_supervisor flag
  - Unique constraint on (user_id, district_id)

- [ ] 1.3 Create migration: access_requests and access_grants tables
  - OAuth-style consent workflow
  - Time-limited grants with expiration
  - access_requests.expires_at for 30-day auto-expire of pending requests
  - Proper foreign keys and indexes

- [ ] 1.4 Create migration: modify farms table
  - Add district_id column
  - Trigger to validate level 2
  - Trigger to revoke all active access_grants when district changes (R3.4)
  - Index on district_id

- [ ] 1.5 Create migration: species_thresholds table
  - Species-specific mortality thresholds
  - Seed default thresholds

- [ ] 1.6 Update TypeScript types
  - Add all new table interfaces to app/lib/db/types.ts
  - Add 'observer' to FarmRole type in app/lib/db/types.ts
  - Update Database interface

- [ ] 1.7 Update auth system for observer role (3 files + 1 function)
  - app/lib/db/types.ts: Add 'observer' to FarmRole type (line 330)
  - app/features/auth/utils.ts: Add 'observer' to FarmRole type (line 305)
  - app/features/users/repository.ts: Add 'observer' to FarmRole type (line 37)
  - app/features/farms/service.ts: Update validateFarmRole() to include 'worker' AND 'observer'
  - app/features/auth/utils.ts: Add observer entry to ROLE_PERMISSIONS
    - Observer gets: `['batch:read', 'farm:read']` (NO finance:read - differs from worker intentionally)
    - Worker has: `['batch:read', 'finance:read']` (existing)
  - Create checkObserverAccess() function that checks access_grants table
  - Update getUserPermissions() to check BOTH user_farms AND access_grants

- [ ] 1.8 Create constants file with configurable defaults
  - VISIT_EDIT_WINDOW_HOURS (default 24, env configurable)
  - ACCESS_REQUEST_EXPIRY_DAYS (default 30)
  - ACCESS_GRANT_DEFAULT_DAYS (default 90)
  - ACCESS_EXPIRY_WARNING_DAYS (default 7)

- [ ] 1.9 Add error codes (use available ranges - NOT conflicting with Marketplace/Digital Foreman)
  - NOT_FOUND: 40434-40438 (40432-40433 used by Marketplace)
  - FORBIDDEN: 40330-40332 (available)
  - VALIDATION: 40012-40016 (40010-40011 used by Marketplace)
  - CONFLICT: 40906-40909 (40903-40905 used by Digital Foreman/Marketplace)

- [ ] 1.10 Configure Cloudflare cron triggers
  - Add triggers section to wrangler.jsonc
  - Cron: "0 _/6 _ \* \*" for outbreak detection
  - Cron: "0 0 \* \* \*" for access grant expiration
  - Cron: "0 9 \* \* \*" for expiration warnings
  - Create app/features/extension/scheduled.ts with handler functions
  - Document integration with TanStack Start entry point

### Week 2: Repository & Service Layer

- [ ] 2.1 Create regions-repository.ts
  - CRUD operations for regions
  - getRegionsByCountry, getDistrictsByRegion
  - hasChildRegions, hasFarmAssignments

- [ ] 2.2 Create user-districts-repository.ts
  - assignUserToDistrict, removeUserFromDistrict
  - getUserDistricts, getDistrictUsers
  - isSupervisor check

- [ ] 2.3 Create access-repository.ts
  - createAccessRequest, getAccessRequest
  - respondToAccessRequest (approve/deny)
  - createAccessGrant, revokeAccessGrant
  - getActiveAccessGrant, getAccessibleFarms

- [ ] 2.4 Create health-service.ts
  - calculateHealthStatus (species-specific)
  - calculateMortalityRate
  - getSpeciesThresholds

- [ ] 2.5 Create access-service.ts
  - validateAccessRequest
  - calculateExpirationDate
  - isAccessActive, canRevokeAccess

- [ ] 2.6 Implement rate limiting for access requests
  - Max 5 pending requests per agent per day
  - Use existing rate limiting pattern if available, or create simple counter

- [ ] 2.7 Write property tests
  - Health status calculation (species-specific)
  - Access expiration logic
  - Mortality rate calculation

**Checkpoint:** Run migrations, verify schema, run property tests, verify ROLE_PERMISSIONS includes observer

---

## Phase 2: Server Functions & Dashboard (Weeks 3-4)

### Week 3: Access Workflow Server Functions

- [ ] 3.1 Create server.ts with access functions
  - createAccessRequestFn
  - respondToAccessRequestFn
  - revokeAccessFn
  - getAccessRequestsFn (for farmer)
  - getMyAccessGrantsFn (for agent)

- [ ] 3.2 Create notification integration
  - Add notification types to types.ts
  - Create notifications for access events
  - accessRequest, accessGranted, accessDenied

- [ ] 3.3 Create audit logging
  - Log access requests, grants, revocations
  - Log data access by extension workers

- [ ] 3.4 Write integration tests
  - Full access request workflow
  - Expiration handling
  - Revocation handling

### Week 4: District Dashboard

- [ ] 4.1 Create getDistrictDashboardFn
  - Optimized CTE query (no N+1)
  - Species-specific health status
  - Pagination, filtering, search

- [ ] 4.2 Create getFarmHealthSummaryFn
  - Read-only farm view
  - Financial data filtering
  - District comparison

- [ ] 4.3 Create getUserDistrictsFn
  - Get user's assigned districts
  - Include supervisor flag

- [ ] 4.4 Create district dashboard UI
  - Route: /extension/district/$districtId
  - Farm list with health status cards
  - Aggregate statistics
  - Filters and search

- [ ] 4.5 Create farm health summary UI
  - Route: /extension/farm/$farmId
  - Read-only batch view
  - Visit history section

- [ ] 4.6 Create access management UI (farmer side)
  - Route: /farms/$farmId/access
  - Pending requests list
  - Active grants list
  - Approve/deny/revoke actions

**Checkpoint:** Full access workflow working, dashboard displaying farms

---

## Phase 3: Outbreak Detection & Visits (Weeks 5-6)

### Week 5: Outbreak Detection

- [ ] 5.1 Create migration: outbreak_alerts and outbreak_alert_farms tables
  - Junction table for proper foreign keys
  - Status tracking

- [ ] 5.2 Create outbreak-service.ts
  - detectOutbreaks (species-specific)
  - classifySeverity
  - shouldCreateAlert (deduplication)

- [ ] 5.3 Create outbreak-repository.ts
  - createOutbreakAlert
  - addFarmToAlert
  - updateAlertStatus
  - getActiveAlerts

- [ ] 5.4 Create outbreak server functions
  - triggerOutbreakDetectionFn (admin)
  - getOutbreakAlertsFn
  - updateOutbreakAlertFn
  - markAsFalsePositiveFn

- [ ] 5.5 Create outbreak alerts UI
  - Route: /extension/alerts
  - Alert list with severity indicators
  - Alert detail with affected farms
  - Status update form

- [ ] 5.6 Create background job
  - Cron trigger for outbreak detection
  - Cron trigger for access request expiration (30-day auto-expire)
  - Notification creation for alerts
  - Consider event-driven detection for critical cases (future enhancement)

### Week 6: Visit Records

- [ ] 6.1 Create migration: visit_records table
  - All fields including attachments
  - Indexes for queries

- [ ] 6.2 Create visit-repository.ts
  - createVisitRecord
  - updateVisitRecord (24h window)
  - getVisitRecords (by farm, by agent)
  - acknowledgeVisit

- [ ] 6.3 Create file upload service
  - Use existing storage abstraction (app/features/integrations/storage/)
  - NOT hardcoded R2 - use uploadFile(), getSignedUrl(), deleteFile()
  - File validation (type, size)
  - Path convention: visit-records/{visitId}/{filename}

- [ ] 6.4 Create visit server functions
  - createVisitRecordFn
  - updateVisitRecordFn
  - getVisitRecordsFn
  - uploadAttachmentFn
  - acknowledgeVisitFn

- [ ] 6.5 Create visit record UI (agent side)
  - Visit form with file upload
  - Visit history list
  - Edit within 24h

- [ ] 6.6 Create visit history UI (farmer side)
  - Visit list in farm detail
  - Acknowledge button
  - Attachment viewer

**Checkpoint:** Outbreak detection working, visit records functional

---

## Phase 4: Supervisor & Polish (Weeks 7-8)

### Week 7: Supervisor Dashboard

- [ ] 7.1 Create supervisor server functions
  - getSupervisorDashboardFn
  - getDistrictTrendsFn
  - getAgentActivityFn

- [ ] 7.2 Create supervisor dashboard UI
  - Route: /extension/supervisor
  - Multi-district overview
  - District comparison cards
  - Agent activity tracking

- [ ] 7.3 Create navigation transformation
  - Detect user_districts entries
  - Show extension navigation
  - Role switcher for dual-role users

- [ ] 7.4 Create data export
  - exportDistrictDataFn (CSV)
  - exportOutbreakHistoryFn (CSV)
  - Respect financial visibility
  - Log all exports to audit_logs

- [ ] 7.5 Create threshold admin UI (admin only)
  - Route: /admin/extension/thresholds
  - List/edit species_thresholds
  - Support region-specific overrides

- [ ] 7.6 Implement data retention policy
  - visit_records: 2-year retention
  - outbreak_alerts: 2-year retention
  - access_grants: Keep indefinitely (audit trail)
  - Add cleanup to daily cron job

### Week 8: Testing & Deployment

- [ ] 8.1 Write comprehensive tests
  - Property tests for all services
  - Integration tests for all workflows
  - E2E tests for critical paths

- [ ] 8.2 Performance testing
  - District dashboard with 100+ farms
  - Outbreak detection with 1000+ batches
  - Access check performance

- [ ] 8.3 Security review
  - Access control verification
  - Financial data filtering
  - Audit log completeness

- [ ] 8.4 Documentation
  - API documentation
  - User guides (agent, farmer, supervisor)
  - Admin guide

- [ ] 8.5 Deployment
  - Run migrations on production
  - Deploy to Cloudflare Workers
  - Monitor for errors
  - Verify functionality

**Checkpoint:** All features complete, tests passing, deployed

---

## Success Criteria

### Phase 1 Success

- [ ] All migrations run successfully
- [ ] TypeScript types compile
- [ ] Property tests pass
- [ ] FarmRole updated in ALL 3 locations
- [ ] validateFarmRole() includes 'worker' and 'observer'

### Phase 2 Success

- [ ] Agents can request access
- [ ] Farmers can approve/deny
- [ ] Dashboard shows accessible farms
- [ ] Health status is species-specific

### Phase 3 Success

- [ ] Outbreak detection finds patterns
- [ ] Alerts created and notified
- [ ] Visit records can be created
- [ ] File uploads work

### Phase 4 Success

- [ ] Supervisor dashboard works
- [ ] Navigation transforms correctly
- [ ] Data export works with audit logging
- [ ] Threshold admin UI works
- [ ] Retention policy implemented
- [ ] All tests pass

---

## Requirements Traceability

| Requirement                  | Task(s)  | Notes                                    |
| ---------------------------- | -------- | ---------------------------------------- |
| R5 (Rate limiting)           | 2.6      | Max 5 pending requests per agent per day |
| R8 (Configurable thresholds) | 1.5, 7.5 | DB table + admin UI                      |
| R15 (2-year retention)       | 7.6      | Cleanup in daily cron                    |
| R16 (Export audit logging)   | 7.4      | Log all exports to audit_logs            |

---

## Risk Mitigation

| Risk                         | Mitigation                                                     |
| ---------------------------- | -------------------------------------------------------------- |
| N+1 query performance        | CTE-based queries, pagination                                  |
| False positive outbreaks     | Species-specific thresholds, filters                           |
| File upload failures         | Retry logic, size limits                                       |
| Access expiration race       | Indexed queries, background job                                |
| Offline sync conflicts       | Last-write-wins, audit trail                                   |
| Observer bypasses user_farms | checkObserverAccess uses access_grants, not user_farms         |
| Cron handler not triggered   | Verify wrangler.jsonc triggers section, test with wrangler dev |

---

## Dependencies

- **Storage Service:** Use existing `app/features/integrations/storage/` abstraction (NOT hardcoded R2)
- **Cron Triggers:** Must configure in wrangler.jsonc
- **Existing Systems:** notifications, audit_logs, batches, auth/utils.ts

---

## Timeline Summary

| Phase     | Duration    | Deliverable                 |
| --------- | ----------- | --------------------------- |
| Phase 1   | 2 weeks     | Database + core types       |
| Phase 2   | 2 weeks     | Access workflow + dashboard |
| Phase 3   | 2 weeks     | Outbreak detection + visits |
| Phase 4   | 2 weeks     | Supervisor + polish         |
| **Total** | **8 weeks** | Complete feature            |

---

## Notes

### Patterns from Digital Foreman

- FarmRole extension (added 'worker', we add 'observer')
- GPS verification in service layer (we use district assignment)
- Photo storage in R2 (we use for visit attachments)
- Offline-first with sync (we use for access checks)

### Patterns from IoT Sensor Hub

- Background job for detection (we use for outbreak detection)
- Threshold configuration (we use species_thresholds table)
- Alert management (we use outbreak_alerts)

### Key Differences from Original Spec

1. user_districts table (not global role)
2. Species-specific thresholds (not fixed 5%/10%)
3. Junction table for alerts (not TEXT[])
4. CTE queries (not N+1)
5. Proper foreign keys (ON DELETE behaviors)
6. checkObserverAccess() separate from checkFarmAccess() - uses access_grants table
7. Cron triggers configured in wrangler.jsonc (not assumed)
