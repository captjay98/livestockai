# Requirements Document - Extension Worker Mode (v3 - Final)

## Introduction

Extension Worker Mode transforms OpenLivestock from a single-farm management tool into a multi-farm oversight platform for agricultural extension workers. Extension workers are government or NGO field agents who advise multiple farmers in a geographic region, helping them improve livestock production practices and connecting them with resources.

**Core Vision (from ROADMAP.md):**

- **Observer Pattern:** Agents observe linked farms, they don't own farm data
- **Linked Accounts:** OAuth-style handshake where Farmer grants scope-limited access to Agent
- **Remote Triage:** Agents view aggregated mortality/growth charts across their district to spot disease outbreaks early
- **Digital Prescriptions:** Visit Records created by Agents sync to farmer's "Vet Visits" tab

**Key Design Decisions:**

- **Extend FarmRole:** Add 'observer' role to existing user_farms table (like Digital Foreman added 'worker')
- **District Assignment:** New user_districts table for district-level assignments (separate from farm-level access)
- **Time-Limited Access:** OAuth-style consent with 90-day default expiration
- **Species-Specific Thresholds:** Health status uses species-appropriate mortality thresholds
- **2-Level Hierarchy:** State/Province → District (pragmatic, not 4-level)

## Glossary

- **Extension_Worker**: Government/NGO field agent who advises farmers (Observer role)
- **Extension_Supervisor**: Senior extension worker overseeing multiple districts
- **District**: Level 2 geographic unit (LGA, Sub-County, Block, Município)
- **Region**: Level 1 geographic unit (State, Province, County)
- **Access_Grant**: Time-limited permission from farmer to extension worker
- **Visit_Record**: Digital prescription - agent's findings and recommendations
- **Outbreak_Alert**: Warning when 3+ farms show high mortality (species-specific)
- **Health_Status**: Color-coded indicator (green/amber/red) using species-specific thresholds

## Requirements

### Requirement 1: Geographic Hierarchy

**User Story:** As an administrator, I want to configure geographic regions so extension workers can be assigned to districts.

**Acceptance Criteria:**

1. System stores countries with ISO 3166-1 alpha-2 codes
2. System supports 2-level hierarchy: Region (level 1) → District (level 2)
3. Regions have unique names within country (constraint: country_code + parent_id + name)
4. Regions have slugs for URL-friendly identifiers
5. Regions can be deactivated (is_active flag) but not deleted if farms assigned
6. Regions support localized names (JSONB)

### Requirement 2: Extension Worker Role

**User Story:** As an administrator, I want to assign extension worker roles so agents can access district oversight features.

**Acceptance Criteria:**

1. System adds 'observer' to FarmRole type (like 'worker' in Digital Foreman)
2. System creates user_districts table for district-level assignments
3. Extension workers are assigned to districts via user_districts (not user_farms)
4. When user has district assignments, navigation transforms to district view
5. Users can have both farmer role (on their farms) AND observer role (on other farms)
6. Supervisor role is a flag on user_districts (is_supervisor: boolean)

### Requirement 3: Farm District Assignment

**User Story:** As a farmer, I want to assign my farm to a district so local extension workers can find me.

**Acceptance Criteria:**

1. Farms have optional district_id (level 2 region only)
2. System validates district is level 2 (trigger or check constraint)
3. Farms without district are excluded from extension worker views
4. When farm changes district, all active access grants are revoked
5. Farm district shown in farm settings

### Requirement 4: Access Request Workflow (OAuth-Style)

**User Story:** As a farmer, I want to control who can see my farm data through an approval workflow.

**Acceptance Criteria:**

1. Extension workers request access to specific farms (access_requests table)
2. Requests include: purpose, requested duration (30-365 days, default 90)
3. Farmers receive notification of access requests
4. Farmers can approve (creates access_grant) or deny (with optional reason)
5. Access grants have expiration date and financial_visibility flag
6. Access grants link back to original request (access_request_id)
7. Farmers can revoke access at any time
8. System auto-expires grants and notifies both parties
9. All consent changes logged in audit_logs

### Requirement 5: Data Access Control

**User Story:** As an extension worker, I want to see only farms that granted me access.

**Acceptance Criteria:**

1. Extension workers see farms where: district matches AND access_grant is active
2. Financial data (costs, revenue, profit) hidden unless financial_visibility = true
3. All data access logged in audit_logs
4. Rate limiting: max 100 farms per query, max 1000 queries per day

### Requirement 6: District Dashboard

**User Story:** As an extension worker, I want a dashboard showing all accessible farms in my district.

**Acceptance Criteria:**

1. Shows farms with active access grants in worker's assigned districts
2. Each farm shows health status (green/amber/red) using species-specific thresholds
3. Aggregate stats: total farms, total livestock, average mortality
4. Sorted by urgency (red first, then amber, then green)
5. Shows active outbreak alert count
6. Filterable by livestock type and health status
7. Searchable by farm name
8. Paginated (50 farms per page)

### Requirement 7: Farm Health Summary (Read-Only)

**User Story:** As an extension worker, I want to view a farm's health details to provide informed advice.

**Acceptance Criteria:**

1. Read-only view (no edit capabilities)
2. Shows: batch overview, mortality rates, growth metrics, vaccination status
3. Shows visit history from all extension workers
4. Financial data hidden unless financial_visibility granted
5. Shows comparison to district average (percentile ranking)

### Requirement 8: Health Status Calculation (Species-Specific)

**User Story:** As an extension worker, I want health status to reflect species-appropriate thresholds.

**Acceptance Criteria:**

1. Health status uses species-specific mortality thresholds:
   - Broiler: green ≤5%, amber ≤10%, red >10%
   - Layer: green ≤3%, amber ≤7%, red >7%
   - Catfish: green ≤12%, amber ≤18%, red >18%
   - Tilapia: green ≤10%, amber ≤15%, red >15%
   - Cattle: green ≤2%, amber ≤5%, red >5%
   - Goats/Sheep: green ≤3%, amber ≤6%, red >6%
2. Thresholds stored in database (configurable per region)
3. Mortality calculated over last 30 days
4. Status recalculated on-demand (not stored)

### Requirement 9: Outbreak Detection (Species-Specific)

**User Story:** As an extension worker, I want alerts when multiple farms show high mortality.

**Acceptance Criteria:**

1. Alert when 3+ farms in same district exceed species-specific red threshold within 7 days
2. Detection is species-specific (broiler outbreak ≠ catfish outbreak)
3. Minimum batch size: 50 animals (ignore small batches)
4. Exclude batches <7 days old (early mortality is normal)
5. Severity: watch (3-4 farms), alert (5-9 farms), critical (10+ farms)
6. Notifications sent to district extension workers
7. Critical alerts also notify supervisors
8. Alerts tracked with status: active, monitoring, resolved

### Requirement 10: Outbreak Alert Management

**User Story:** As an extension worker, I want to manage outbreak alerts.

**Acceptance Criteria:**

1. Dashboard shows active alerts for worker's districts
2. Alert detail shows affected farms with health metrics
3. Timeline shows when each farm reported issues
4. Workers can update status and add notes
5. Historical alerts viewable for trend analysis
6. Can mark alert as false positive

### Requirement 11: Supervisor Dashboard

**User Story:** As a supervisor, I want to see aggregated data across multiple districts.

**Acceptance Criteria:**

1. Shows all districts where user is supervisor
2. Per-district stats: farm count, livestock count, health distribution
3. Highlights districts with active outbreak alerts
4. Shows extension worker activity per district
5. Drill-down to individual district dashboards
6. Regional mortality trends over time

### Requirement 12: Digital Visit Records

**User Story:** As an extension worker, I want to record farm visits digitally.

**Acceptance Criteria:**

1. Create visit records for farms with active access
2. Required fields: visit_date, findings, recommendations
3. Optional: attachments (photos, PDFs), follow_up_date
4. Visit type: routine, emergency, follow_up
5. Farmer receives notification when visit recorded
6. Farmer can acknowledge visit record
7. Visits editable within 24 hours of creation
8. Visit history visible to farmer in farm detail

### Requirement 13: Notification Integration

**User Story:** As an extension worker, I want notifications for important events.

**Acceptance Criteria:**

1. Notification types:
   - accessRequest: Farmer receives access request
   - accessGranted: Agent receives approval
   - accessDenied: Agent receives denial
   - accessExpiring: Both parties, 7 days before expiration
   - accessExpired: Both parties, when access expires
   - outbreakAlert: Agent receives outbreak alert
   - visitRecordCreated: Farmer receives visit record
2. Uses existing notification system
3. Notification preferences configurable

### Requirement 14: Navigation Transformation

**User Story:** As an extension worker, I want navigation to reflect my role.

**Acceptance Criteria:**

1. If user has user_districts entries → show extension navigation
2. Extension nav: District Dashboard, Outbreak Alerts, My Visits
3. If user also owns farms → show role switcher
4. Preserve farmer navigation for users without extension role

### Requirement 15: Audit Trail

**User Story:** As an administrator, I want complete audit trail of extension activities.

**Acceptance Criteria:**

1. Log: farm data views, alert status changes, visit records, consent changes
2. Include: user_id, action, entity_type, entity_id, timestamp, ip_address
3. Uses existing audit_logs table
4. Retention: 2 years

### Requirement 16: Data Export

**User Story:** As an extension worker, I want to export district data for reports.

**Acceptance Criteria:**

1. Export district summary to CSV
2. Export outbreak history to CSV
3. Only include farms with active access
4. Exclude financial data unless visibility granted
5. Log all exports in audit_logs
