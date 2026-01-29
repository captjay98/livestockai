# Implementation Plan: Intelligent Forecasting

## Overview

This implementation plan builds the Intelligent Forecasting feature on top of the Reference Data Foundation. The plan follows a bottom-up approach: first implementing the pure service layer calculations, then server functions, then UI components, and finally integration with existing pages.

**Dependency:** This spec requires `.kiro/specs/reference-data-foundation/` to be completed first. ✅ DONE

## Implementation Status: ✅ COMPLETE (2026-01-26)

### Service Layer (`app/features/batches/forecasting-service.ts`)

- ✅ `calculateADG()` - Handles three cases (two samples, single sample, growth curve estimate)
- ✅ `calculateExpectedADG()` - Derives ADG from growth curve slope
- ✅ `calculatePerformanceIndex()` - Returns percentage
- ✅ `classifyStatus()` - Thresholds at 95/105
- ✅ `calculateDeviationPercent()` - Helper function
- ✅ `projectHarvestDate()` - With edge case handling
- ✅ `generateChartData()` - For growth visualization

### Alert Service (`app/features/batches/alert-service.ts`)

- ✅ `determineAlertSeverity()` - Critical (<80), Warning (80-89), Info (>110)
- ✅ `generateRecommendation()` - Actionable messages
- ✅ `shouldCreateAlert()` - 24-hour deduplication

### Server Functions (`app/features/batches/forecasting.ts`)

- ✅ `getEnhancedProjectionFn` - Full projection with ADG, PI, status
- ✅ `getGrowthChartDataFn` - Chart data generation
- ✅ `checkDeviationAlertsFn` - Alert automation
- ✅ `getBatchesNeedingAttentionFn` - Dashboard attention list
- ✅ `getUpcomingHarvestsFn` - Batches with harvest in next 14 days

### Notification Types (`app/features/notifications/types.ts`)

- ✅ Added `growthDeviation` and `earlyHarvest` types

### UI Components

- ✅ `app/components/batches/projections-card.tsx` - Enhanced with ADG, PI, status colors
- ✅ `app/components/batches/growth-chart.tsx` - Recharts visualization
- ✅ `app/components/dashboard/batches-attention.tsx` - Dashboard attention section
- ✅ `app/components/dashboard/upcoming-harvests.tsx` - Upcoming harvests section

### Page Integration

- ✅ `app/routes/_auth/batches/$batchId/index.tsx` - Growth tab, target weight prompt
- ✅ `app/routes/_auth/dashboard/index.tsx` - BatchesAttention + UpcomingHarvests
- ✅ `app/components/batches/batch-details/batch-kpis.tsx` - Current Weight, Expected Weight, Performance Index

### Tests

- ✅ `tests/features/batches/forecasting-service.property.test.ts` - 14 property tests
- ✅ `tests/features/batches/enhanced-projection.integration.test.ts` - 4 integration tests
- ✅ `tests/features/batches/alert-deduplication.integration.test.ts` - 4 integration tests

## Test Results

```
Unit Tests:     1323 passed ✅
Integration:    39 passed ✅
```

## Tasks

- [x] 1. Implement Forecasting Service Layer
  - [x] 1.1 Create forecasting service with ADG calculation functions
  - [x] 1.3 Implement Performance Index and status classification
  - [x] 1.5 Implement harvest date projection
  - [x] 1.7 Implement chart data generation

- [x] 2. Checkpoint - Ensure service layer tests pass ✅

- [x] 3. Implement Alert Service Layer
  - [x] 3.1 Create alert service with severity classification
  - [x] 3.3 Implement alert deduplication logic

- [x] 4. Extend Notification Types
  - [x] 4.1 Update notification types for growth alerts

- [x] 5. Implement Server Functions
  - [x] 5.1 Implement getEnhancedProjectionFn
  - [x] 5.3 Implement getGrowthChartDataFn
  - [x] 5.5 Implement checkDeviationAlertsFn
  - [x] 5.6 Implement getBatchesNeedingAttentionFn

- [x] 6. Checkpoint - Ensure server function tests pass ✅

- [x] 7. Implement UI Components
  - [x] 7.1 Enhance existing Forecast Card component
  - [x] 7.3 Create Growth Chart component
  - [x] 7.5 Create Batches Attention component for dashboard

- [x] 8. Integrate with Batch Detail Page
  - [x] 8.2 Add Growth tab with Growth Chart
  - [x] 8.3 Update KPI section with forecasting metrics
  - [x] 8.4 Add target weight prompt

- [x] 9. Integrate with Dashboard
  - [x] 9.1 Add Batches Needing Attention section
  - [x] 9.2 Add Upcoming Harvests section

- [x] 10. Checkpoint - Ensure UI integration works ✅

- [x] 12. Final Checkpoint ✅
  - [x] All tests passing (1323 unit + 39 integration)

## Notes

- Property tests marked with `*` were optional and skipped for faster delivery
- Component tests removed per user request
- All server functions use dynamic imports for Cloudflare Workers compatibility
- Spec is 100% complete and ready for production
