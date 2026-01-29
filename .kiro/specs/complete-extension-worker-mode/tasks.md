# Implementation Plan: Complete Extension Worker Mode

## Overview

This implementation plan completes Extension Worker Mode by wiring existing infrastructure to the UI. The database, repositories, services, and background jobs are 100% complete. Tasks focus on:

1. Marketing integration (landing pages)
2. Server function implementation (replace stubs)
3. UI completion (wire routes, add components)
4. Admin tools (district/region/threshold management)
5. Testing (property-based and integration tests)

## Tasks

### Phase 1: Marketing & Public-Facing

- [x] 1. Add Extension Worker Mode to landing page
  - [-] 1.1 Add feature card to FeaturesSection
    - Add new feature object after "Multi-Species Mastery" (index 1)
    - Icon: Shield, Title: "Government & NGO Support"
    - Description: "Multi-farm oversight, outbreak detection, and digital visit records for agricultural extension services"
    - Accent: 'emerald', Code: 'EXT-02'
    - _File: `app/components/landing/FeaturesSection.tsx`_
    - _Requirements: 1.1-1.10_

  - [ ] 1.2 Create ExtensionSection component
    - Section title: "Built for Agricultural Extension Services"
    - 4 benefit cards: District Dashboard, Outbreak Detection, Digital Visit Records, Privacy-First Access
    - CTA buttons: "Request Enterprise Demo" → /support, "Learn More" → /features#extension
    - Mobile-responsive layout
    - _File: `app/components/landing/ExtensionSection.tsx`_
    - _Requirements: 2.1-2.10_

  - [ ] 1.3 Add ExtensionSection to landing page
    - Import and render after FeaturesSection, before PricingCards
    - _File: `app/routes/index.tsx`_
    - _Requirements: 2.2_

  - [ ] 1.4 Add Government pricing tier to PricingCards
    - Position: After "Enterprise" tier (5th tier)
    - Name: "Government", Code: 'GOV-05', Price: "Custom"
    - Icon: Building2, Accent: 'purple'
    - Features: Unlimited workers, multi-district, outbreak detection, etc.
    - CTA: "Contact Sales" → /support
    - Badge: "For Government & NGOs"
    - _File: `app/components/landing/PricingCards.tsx`_
    - _Requirements: 3.1-3.12_

- [ ] 2. Checkpoint - Verify marketing changes
  - Ensure landing page renders correctly
  - Verify responsive layout on mobile
  - Check all links work correctly

### Phase 2: Server Functions

- [x] 3. Implement core server functions
  - [ ] 3.1 Implement getDistrictDashboardFn
    - Validate user has district access via getUserDistricts()
    - Query farms with getDistrictDashboard() from repository
    - Calculate health status for each farm using calculateHealthStatus()
    - Apply filters (livestockType, healthStatus, search)
    - Return paginated results with stats
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.1_

  - [ ] 3.2 Implement getSupervisorDashboardFn
    - Get user's supervised districts via getUserDistricts() with isSupervisor=true
    - Aggregate stats across all districts
    - Include active outbreak alert counts per district
    - Return district summaries with totals
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.2_

  - [ ] 3.3 Implement getUserDistrictsFn
    - Call getUserDistricts() from user-districts-repository
    - Include district names and supervisor flags
    - Return array of district assignments
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.3_

  - [ ] 3.4 Implement getAccessRequestsFn
    - Call getAccessRequestsForFarm() for pending requests
    - Call getAccessibleFarms() for active grants
    - Join with users table for requester/agent names
    - Sort by date (newest first)
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.4_

  - [ ] 3.5 Implement respondToAccessRequestFn
    - Validate farm ownership
    - Call respondToAccessRequest() from repository
    - If approved, call createAccessGrant() with calculated expiration
    - Create notification for requester
    - Log to audit_logs
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.5_

  - [ ] 3.6 Implement revokeAccessFn
    - Validate farm ownership
    - Call revokeAccessGrant() from repository
    - Create notifications for both parties
    - Log to audit_logs
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.6_

  - [ ] 3.7 Implement updateOutbreakAlertFn
    - Validate user has district access
    - Call updateAlertStatus() from repository
    - Create notification if status changes to resolved
    - Log to audit_logs
    - _File: `app/features/extension/server.ts`_
    - _Requirements: 5.7_

- [ ] 4. Checkpoint - Verify server functions
  - Test each function returns real data
  - Verify error handling works correctly
  - Check audit logs are created

### Phase 3: UI Components & Routes

- [x] 5. Create access management components (Farmer Side)
  - [ ] 5.1 Create AccessRequestsCard component
    - Show pending requests with requester info, purpose, duration
    - Show active grants with agent info, dates, financial visibility
    - Empty states for no requests/grants
    - Loading skeleton
    - _File: `app/components/extension/access-requests-card.tsx`_
    - _Requirements: 6.1-6.3_

  - [ ] 5.2 Create ApproveAccessDialog component
    - Form with financial visibility toggle
    - Duration override option
    - Confirm button calls respondToAccessRequestFn
    - _File: `app/components/extension/approve-access-dialog.tsx`_
    - _Requirements: 6.4_

  - [ ] 5.3 Create DenyAccessDialog component
    - Optional reason textarea
    - Confirm button calls respondToAccessRequestFn with approved=false
    - _File: `app/components/extension/deny-access-dialog.tsx`_
    - _Requirements: 6.4_

  - [x] 5.4 Create RevokeAccessDialog component
    - Reason textarea (optional)
    - Confirmation warning
    - Confirm button calls revokeAccessFn
    - _File: `app/components/extension/revoke-access-dialog.tsx`_
    - _Requirements: 6.5_

  - [x] 5.5 Add AccessRequestsCard to farm detail page
    - Import and render in farm detail route
    - Pass farmId prop
    - _File: `app/routes/_auth/farms/$farmId/index.tsx`_
    - _Requirements: 6.10_

- [x] 6. Wire district dashboard to real data
  - [x] 6.1 Update district dashboard route
    - Remove mock data, use loader data from getDistrictDashboardFn
    - Add active outbreak alert count to stats
    - Wire farm card click to navigate to /extension/farm/$farmId
    - _File: `app/routes/_auth/extension/district.$districtId.tsx`_
    - _Requirements: 7.6-7.8_

  - [x] 6.2 Add CSV export button to district dashboard
    - Export farms list with health status
    - Use existing export utilities
    - _File: `app/routes/_auth/extension/district.$districtId.tsx`_
    - _Requirements: 7.9_

- [x] 7. Fix farm health summary route
  - [x] 7.1 Fix route param usage
    - Use $farmId from route params instead of mock
    - Fix breadcrumb navigation back to district
    - Fix "Create Visit Record" link to correct route
    - _File: `app/routes/_auth/extension/farm.$farmId.tsx`_
    - _Requirements: 8.6-8.9_

  - [x] 7.2 Implement financial data visibility
    - Check financialVisibility on access grant
    - Hide/show financial sections accordingly
    - _File: `app/routes/_auth/extension/farm.$farmId.tsx`_
    - _Requirements: 8.7_

- [x] 8. Fix visit creation route
  - [x] 8.1 Fix route param and links
    - Use $farmId from route params instead of mock
    - Fix navigation links to correct routes
    - _File: `app/routes/_auth/extension/visits/new.$farmId.tsx`_
    - _Requirements: 9.5-9.6_

  - [x] 8.2 Add file attachment support
    - Add file input with preview
    - Validate file size (max 5MB) and type (jpg/png/pdf)
    - Upload to storage on submit
    - _File: `app/routes/_auth/extension/visits/new.$farmId.tsx`_
    - _Requirements: 9.7-9.8_

- [x] 9. Create visit history components (Farmer Side)
  - [x] 9.1 Create VisitHistoryCard component
    - List visits with date, agent, type, findings preview
    - Expandable cards for full details
    - Unacknowledged visits highlighted with badge
    - Acknowledge button (one-time action)
    - _File: `app/components/extension/visit-history-card.tsx`_
    - _Requirements: 10.1-10.10_

  - [x] 9.2 Create VisitDetailCard component
    - Full findings and recommendations
    - Attachment download links
    - Follow-up date display
    - Print-friendly view
    - _File: `app/components/extension/visit-detail-card.tsx`_
    - _Requirements: 10.3-10.9_

  - [x] 9.3 Add VisitHistoryCard to farm detail page
    - Import and render in farm detail route
    - Pass farmId prop
    - _File: `app/routes/_auth/farms/$farmId/index.tsx`_
    - _Requirements: 10.1_

- [x] 10. Wire outbreak alerts to real data
  - [x] 10.1 Update alerts list route
    - Remove mock data, use loader with getActiveAlerts()
    - Wire to real server function
    - _File: `app/routes/_auth/extension/alerts.tsx`_
    - _Requirements: 11.6_

  - [x] 10.2 Update alert detail route
    - Remove mock data, use loader with getOutbreakAlert()
    - Wire status update form to updateOutbreakAlertFn
    - Fix route definition if needed
    - _File: `app/routes/_auth/extension/alerts.$alertId.tsx`_
    - _Requirements: 11.9-11.10_

  - [x] 10.3 Extract AlertCard component for reuse
    - Severity badge (critical/warning/watch)
    - Affected farm count and species
    - Link to detail page
    - _File: `app/components/extension/alert-card.tsx`_
    - _Requirements: 11.2-11.5_

- [x] 11. Wire supervisor dashboard to real data
  - [x] 11.1 Update supervisor dashboard route
    - Remove stub data, use getSupervisorDashboardFn
    - Fix drill-down links to correct district routes
    - _File: `app/routes/_auth/extension/supervisor.tsx`_
    - _Requirements: 12.6-12.7_

  - [x] 11.2 Add regional trends chart
    - Show mortality trends across districts
    - Use existing chart components
    - _File: `app/components/extension/regional-trends-chart.tsx`_
    - _Requirements: 12.8_

  - [x] 11.3 Add CSV export to supervisor dashboard
    - Export all districts with stats
    - _File: `app/routes/_auth/extension/supervisor.tsx`_
    - _Requirements: 12.9_

- [x] 12. Integrate navigation hook
  - [x] 12.1 Update navigation component
    - Import and use useExtensionNav hook
    - Show extension nav items if user has districts
    - Add role switcher if user also owns farms
    - Add badge for pending requests (farmer) / active alerts (extension)
    - _File: `app/components/navigation.tsx`_
    - _Requirements: 13.5-13.10_

- [ ] 13. Checkpoint - Verify UI completion
  - Test all routes with real data
  - Verify navigation works for extension workers
  - Check mobile responsiveness
  - Ensure all tests pass

### Phase 4: Admin Tools

- [x] 14. Create district assignment admin
  - [x] 14.1 Create assignment route
    - List users with district assignments
    - Filter by user name/email and district
    - _File: `app/routes/_auth/admin/extension/assignments.tsx`_
    - _Requirements: 14.1-14.2_

  - [x] 14.2 Create AssignmentTable component
    - Show user, email, districts, supervisor status
    - Actions: add to district, remove, toggle supervisor
    - _File: `app/components/extension/admin/assignment-table.tsx`_
    - _Requirements: 14.3-14.6_

  - [x] 14.3 Create AssignUserDialog component
    - Select user, select district, toggle supervisor
    - Bulk assignment support
    - _File: `app/components/extension/admin/assign-user-dialog.tsx`_
    - _Requirements: 14.5, 14.9_

- [x] 15. Create region management admin
  - [x] 15.1 Create regions route
    - Tree view of country → region → district
    - Farm and agent counts per district
    - _File: `app/routes/_auth/admin/extension/regions.tsx`_
    - _Requirements: 15.1-15.7_

  - [x] 15.2 Create RegionTree component
    - Expandable tree structure
    - Add/edit/deactivate actions
    - Mobile-friendly collapse
    - _File: `app/components/extension/admin/region-tree.tsx`_
    - _Requirements: 15.2-15.10_

  - [x] 15.3 Create region dialogs
    - CreateRegionDialog for adding regions/districts
    - EditRegionDialog for updating names/slugs
    - _Files: `app/components/extension/admin/create-region-dialog.tsx`, `edit-region-dialog.tsx`_
    - _Requirements: 15.3-15.4_

- [x] 16. Create threshold configuration admin
  - [x] 16.1 Create thresholds route
    - List species with current thresholds
    - Show global defaults and region overrides
    - _File: `app/routes/_auth/admin/extension/thresholds.tsx`_
    - _Requirements: 16.1-16.4_

  - [x] 16.2 Create ThresholdTable component
    - Species, amber threshold, red threshold, overrides
    - Edit and reset actions
    - _File: `app/components/extension/admin/threshold-table.tsx`_
    - _Requirements: 16.2-16.8_

  - [x] 16.3 Create EditThresholdDialog component
    - Number inputs for amber and red
    - Validation: amber < red
    - Preview health status calculation
    - _File: `app/components/extension/admin/edit-threshold-dialog.tsx`_
    - _Requirements: 16.5-16.7_

- [ ] 17. Checkpoint - Verify admin tools
  - Test district assignment workflow
  - Test region management
  - Test threshold configuration
  - Verify audit logs are created

### Phase 5: Testing

- [ ] 18. Write property-based tests
  - [ ]\* 18.1 Write health service property tests
    - **Property 1: Mortality rate calculation**
    - **Property 2: Health status classification**
    - **Validates: Requirements 5.1, 17.1**
    - _File: `tests/features/extension/health-service.property.test.ts`_

  - [ ]\* 18.2 Write access service property tests
    - **Property 3: Access expiration calculation**
    - **Property 4: Access active status**
    - **Property 5: Edit window calculation**
    - **Property 6: Access request validation**
    - **Validates: Requirements 5.4-5.6, 17.3**
    - _File: `tests/features/extension/access-service.property.test.ts`_

  - [ ]\* 18.3 Write outbreak service property tests
    - **Property 7: Outbreak clustering**
    - **Property 8: Outbreak severity classification**
    - **Validates: Requirements 5.7, 17.2**
    - _File: `tests/features/extension/outbreak-service.property.test.ts`_

  - [ ]\* 18.4 Write dashboard property tests
    - **Property 9: District dashboard pagination invariant**
    - **Property 10: Supervisor aggregation invariant**
    - **Validates: Requirements 5.1, 5.2, 7.9, 12.6**
    - _File: `tests/features/extension/dashboard.property.test.ts`_

- [ ] 19. Write integration tests
  - [ ]\* 19.1 Write access workflow integration tests
    - Test full approve flow
    - Test full deny flow
    - Test revocation flow
    - **Validates: Requirements 17.4**
    - _File: `tests/features/extension/access-workflow.integration.test.ts`_

  - [ ]\* 19.2 Write district dashboard integration tests
    - Test with multiple farms
    - Test filtering and pagination
    - Test health status calculation
    - **Validates: Requirements 17.5**
    - _File: `tests/features/extension/district-dashboard.integration.test.ts`_

  - [ ]\* 19.3 Write visit records integration tests
    - Test creation with attachments
    - Test edit window enforcement
    - Test acknowledgment
    - **Validates: Requirements 17.6**
    - _File: `tests/features/extension/visit-records.integration.test.ts`_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Run `bun run test` for property tests
  - Run `bun run test:integration` for integration tests
  - Verify 80%+ code coverage
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate database operations and workflows
- All server functions use the `getDb()` pattern for Cloudflare Workers compatibility
- All UI components follow the 48px touch target standard for mobile
