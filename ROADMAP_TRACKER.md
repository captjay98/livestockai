# OpenLivestock Roadmap Tracker

Progress tracker for Phase 2 "Smart Ecosystem" features, ordered by implementation complexity.

## Legend

- ⬜ Not Started
- 🟡 In Progress (Spec Created)
- 🔵 In Development
- ✅ Complete
- ⏭️ Skipped

---

## Phase 0: Foundation (Prerequisites)

| #   | Status | Feature                       | Effort  | Spec                                           | Notes                                               |
| --- | ------ | ----------------------------- | ------- | ---------------------------------------------- | --------------------------------------------------- |
| 0   | ✅     | **Reference Data Foundation** | 🟢 Easy | [spec](.kiro/specs/reference-data-foundation/) | Breeds table + breed-specific growth curves + seeds |

> **Note:** Reference Data Foundation is a prerequisite for Intelligent Forecasting, Dr. AI, and Feed Formulation Calculator.

---

## Phase 2 Features (Ordered by Complexity)

| #   | Status | Feature                         | Effort       | Spec                                               | Notes                                                                                           |
| --- | ------ | ------------------------------- | ------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | ✅     | **Automated QA Pipeline**       | 🟢 Easy      | [spec](.kiro/specs/automated-qa-pipeline/)         | Playwright E2E + Visual Regression + CI/CD                                                      |
| 2   | ✅     | **Intelligent Forecasting**     | 🟢 Easy      | [spec](.kiro/specs/intelligent-forecasting/)       | Growth curves + harvest predictions + dashboard widgets                                         |
| 3   | ✅     | **Feed Formulation Calculator** | 🟡 Medium    | [spec](.kiro/specs/feed-formulation-calculator/)   | HiGHS WASM LP solver, 10 species, PDF export, price history charts                              |
| 4   | ✅     | **Credit Passport**             | 🟡 Medium    | [spec](.kiro/specs/credit-passport/)               | Institutional-grade verification, 3 report types, Ed25519 signatures                            |
| 5   | ✅     | **IoT Sensor Hub**              | 🟡 Medium    | [spec](.kiro/specs/iot-sensor-hub/)                | HTTP ingestion, threshold/trend alerts, 10 sensor types, aggregation, ESP32 firmware            |
| 6   | ✅     | **Digital Foreman**             | 🟠 Hard      | [spec](.kiro/specs/digital-foreman/)               | Worker role, GPS attendance, task assignments, payroll tracking                                 |
| 7   | ⏭️     | **Offline Marketplace**         | 🟠 Hard      | [spec](.kiro/specs/offline-marketplace/)           | SKIPPED - Spec created, implementation deferred                                                 |
| 8   | ⏭️     | **Extension Worker Mode**       | 🟠 Hard      | [spec](.kiro/specs/extension-worker-mode/)         | SKIPPED - Spec created, implementation deferred                                                 |
| 9   | ✅     | **Offline Writes V1**           | 🟠 Hard      | [spec](.kiro/specs/offline-writes-v1/)             | TanStack Query offline-first, optimistic updates, mutation queue                                |
| 10  | ✅     | **Dr. AI (Vet Assist Mode)**    | 🔴 Very Hard | [integrated](.kiro/specs/gemini-vision-assistant/) | Integrated into Vision Assistant as "Vet Assist Mode" - offline decision tree + photo diagnosis |

---

## Dependencies

```
Reference Data Foundation (Phase 0)
    ├── Intelligent Forecasting (#2)
    ├── Feed Formulation Calculator (#3)
    └── Dr. AI (#10)
```

---

## Progress Summary

- **Total Features:** 11 (1 foundation + 10 phase 2)
- **Completed:** 9 (Reference Data Foundation, Intelligent Forecasting, Feed Formulation Calculator, Credit Passport, IoT Sensor Hub, Digital Foreman, Offline Writes V1, Automated QA Pipeline, Dr. AI/Vet Assist)
- **Skipped:** 2 (Offline Marketplace, Extension Worker Mode)
- **In Progress:** 0
- **Not Started:** 0

---

## Technical Debt: Onboarding Redesign

**Status:** Deferred until core features complete

**Why redesign is needed:**

1. **Feature parity gap** - Onboarding batch creation (`create-batch-step.tsx`) is missing critical fields that the full `BatchDialog` has:
   - No breed selection (affects growth forecasting accuracy)
   - No source size selection
   - No structure assignment (even though structure is created in previous step)
   - No supplier selection
   - No target harvest date

2. **Hardcoded livestock types** - Onboarding shows all 6 types, but `BatchDialog` only shows poultry/fish. Neither respects enabled modules.

3. **Data consistency** - Structure created in step 4 isn't linked to batch in step 5

4. **Code duplication** - Two separate batch creation UIs with different capabilities

**Recommended approach:**

- Reuse `BatchDialog` component in onboarding (with onboarding-specific props)
- Filter livestock types to only show enabled modules
- Auto-assign structure from previous step
- Single source of truth for batch creation logic

**When to implement:** After Phase 2 core features are stable

---

## Changelog

| Date       | Feature                     | Update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-01-26 | Onboarding Redesign         | Deferred - documented technical debt for future redesign after core features complete                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-01-25 | Tracker Created             | Initial roadmap tracker setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-01-25 | Automated QA Pipeline       | Spec created - 13 requirements, 14 task groups                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-01-25 | Reference Data Foundation   | Spec created - 7 requirements, 11 task groups (Phase 0 prerequisite)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-01-25 | Intelligent Forecasting     | Spec created - 8 requirements, 12 task groups (depends on Phase 0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-01-25 | Spec Audit                  | Both specs audited for codebase alignment, updated to avoid duplication                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-01-25 | Feed Formulation Calculator | Spec created - 10 requirements, 15 task groups, HiGHS WASM solver, 10 species support                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-01-26 | Credit Passport             | Spec created - 18 requirements, 19 task groups, institutional-grade verification                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-01-26 | Reference Data Foundation   | Spec audited & fixed: added error codes, verified species casing, fixed migration date, added CONCURRENTLY indexes, added rollback function, clarified forecasting integration with specific line numbers, added UI error handling                                                                                                                                                                                                                                                                                                         |
| 2026-01-26 | IoT Sensor Hub              | Spec created - 8 requirement groups, 17 task groups, 10 sensor types, HTTP/MQTT ingestion, threshold/trend alerts, data aggregation, ESP32 firmware example                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-01-26 | Digital Foreman             | Spec created - 18 requirements, 30 task groups, worker role, GPS geofence attendance, task assignments with photo proof, approval workflows, payroll tracking                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-01-26 | Reference Data Foundation   | **COMPLETE** - All core functionality implemented: breeds table, 24 breeds seeded, breed-specific growth curves, forecasting with breed FCR, batch dialog with breed selection UI. **Note:** Property tests 1-6 from design doc not implemented (marked optional in spec)                                                                                                                                                                                                                                                                  |
| 2026-01-26 | Intelligent Forecasting     | **COMPLETE** - ADG calculations, Performance Index, growth charts (Recharts), alert service with deduplication, dashboard widgets (BatchesAttention, UpcomingHarvests), batch KPIs with forecasting metrics. Property tests: 14 in forecasting-service, 6 in alert-service                                                                                                                                                                                                                                                                 |
| 2026-01-26 | Offline Marketplace         | Spec created - 15 requirements, 22 task groups (~70 sub-tasks), privacy fuzzing service, offline sync engine, Credit Passport integration, public browse access                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-01-26 | Extension Worker Mode       | Spec created - 15 requirements, 23 task groups (~60 sub-tasks), geographic hierarchy, extension agent/supervisor roles, epidemic early warning, consent-based farm access, role-based navigation                                                                                                                                                                                                                                                                                                                                           |
| 2026-01-27 | Feed Formulation Calculator | **COMPLETE** - HiGHS WASM optimization, 10 species support, PDF export with jsPDF, price history charts (Recharts), saved formulations with re-optimize, side-by-side comparison, share codes, batch size scaling, safety margins. **Property tests:** 6 tests in optimization.property.test.ts (unavailable filtering, type conversion, price handling, ID preservation, empty list, all unavailable). **Note:** Property tests 9-24 from design doc not implemented (marked optional in spec)                                            |
| 2026-01-27 | Offline Writes V1           | Spec updated - 13 requirements (added temp ID resolution, mutation deduplication, storage quota monitoring), 19 task groups, TanStack Query offline-first mutations, optimistic updates, mutation queue persistence, service worker fix, conflict resolution                                                                                                                                                                                                                                                                               |
| 2026-01-27 | Dr. AI / Vet Assist         | **INTEGRATED** into Vision Assistant spec as "Vet Assist Mode" - 12 new requirements (16-27), offline decision tree for instant triage, photo diagnosis with store-forward queue, care protocols, vet escalation, integration with Farm Sentinel and Farm Optimizer                                                                                                                                                                                                                                                                        |
| 2026-01-28 | Credit Passport             | **COMPLETE** - All 19 task groups implemented: metrics engine (financial, operational, asset, track record), credit score calculation, Ed25519 signatures, QR verification, PDF generation with @react-pdf/renderer, R2 storage, rate limiting, public verification portal. **Property tests:** 16 passing (metrics + security), 1 skipped (signature round-trip - test env issue). Routes: /credit-passport (wizard), /credit-passport/history, /credit-passport/requests, /verify/$reportId (public)                                     |
| 2026-01-28 | Digital Foreman             | **COMPLETE** - All core functionality implemented: worker profiles, GPS geofence attendance with verification, task assignments with photo proof, approval workflows, payroll periods and wage payments. **Property tests:** 5 test files (geofence, attendance, task, payroll, permission). Components: WorkerDashboard, AttendanceOverview, TaskOverview, PayrollDashboard, GeofenceConfig. Routes: /farms/$farmId/workers, /farms/$farmId/attendance, /farms/$farmId/tasks, /farms/$farmId/payroll, /farms/$farmId/geofence             |
| 2026-01-28 | IoT Sensor Hub              | **COMPLETE** - HTTP ingestion with API key auth, 10 sensor types, threshold/trend alerts, alert processor with cooldown, data aggregation service (hourly/daily), cron job handler, OpenAPI documentation. **Property tests:** 3 test files (alert, ingestion, aggregation - 27 tests). ESP32 DHT22 firmware example with PlatformIO. Routes: /farms/$farmId/sensors, /farms/$farmId/sensors/$sensorId. **Note:** MQTT support deferred (optional)                                                                                         |
| 2026-01-28 | Offline Writes V1           | **COMPLETE** - All 19 task groups implemented: offline-first mutations, optimistic updates for 15 entity types, temp ID resolution chain, mutation deduplication, conflict resolution (last-write-wins), storage quota monitoring (70%/85%/95% thresholds), PWA service worker, OnlineRequired guards. **Property tests:** 8 test files (157 tests) - optimistic-updates, mutation-queue, conflict-resolution, temp-id-resolver, mutation-deduplicator, storage-monitor, pending-count, mutation-persistence. New docs: OFFLINE-SUPPORT.md |
| 2026-01-29 | Automated QA Pipeline       | **COMPLETE** - Playwright E2E tests, visual regression, CI/CD integration                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-01-29 | Dr. AI / Vet Assist         | **COMPLETE** - Integrated into Vision Assistant with offline decision tree, photo diagnosis, care protocols                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-01-29 | Offline Marketplace         | **SKIPPED** - Spec complete, implementation deferred for future release                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-01-29 | Extension Worker Mode       | **SKIPPED** - Spec complete, implementation deferred for future release                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-01-29 | Roadmap Tracker             | Updated status: 9 complete, 2 skipped. Phase 2 core features done.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
