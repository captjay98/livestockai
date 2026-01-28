# Implementation Plan: Offline Writes V1

## Overview

This implementation plan transforms OpenLivestock Manager into a fully offline-capable application by:

1. Configuring TanStack Query for offline-first mutations
2. Adding optimistic updates to all mutation hooks
3. Fixing service worker registration for proper PWA functionality
4. Enhancing sync status visibility

## Tasks

- [x] 1. Configure Query Client for Offline-First Mutations
  - [x] 1.1 Update query-client.ts to use networkMode: 'offlineFirst'
    - Change `networkMode: 'online'` to `networkMode: 'offlineFirst'` in mutations config
    - Add retry configuration with exponential backoff
    - Add `retryDelay` function for exponential backoff calculation
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 1.2 Write property test for mutation queuing behavior
    - **Property 1: Offline Mutation Queuing**
    - **Validates: Requirements 1.1**

- [x] 2. Create Optimistic Update Utilities
  - [x] 2.1 Create app/lib/optimistic-utils.ts with shared utilities
    - Implement `generateTempId()` function using crypto.randomUUID()
    - Implement `createOptimisticContext<T>()` helper for snapshot/rollback
    - Implement `replaceTempId()` helper for success handlers
    - Export TypeScript interfaces for OptimisticContext
    - _Requirements: 2.1, 2.5_
  - [x] 2.2 Write property tests for optimistic utilities
    - **Property 4: Optimistic Updates**
    - **Property 5: Rollback on Failure**
    - **Property 6: Temporary ID Replacement**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 3. Checkpoint - Verify core infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add Optimistic Updates to Batch Mutations
  - [x] 4.1 Create app/features/batches/use-batch-mutations.ts hook
    - Implement `useBatchMutations()` hook with create, update, delete mutations
    - Add `onMutate` handlers for optimistic updates with cache snapshots
    - Add `onError` handlers for rollback
    - Add `onSuccess` handlers for temp ID replacement
    - Add `onSettled` handlers for cache invalidation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 4.2 Write property test for batch mutation optimistic updates
    - **Property 4: Optimistic Updates (batches)**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 5. Add Optimistic Updates to Daily Record Mutations
  - [x] 5.1 Create app/features/feed/use-feed-mutations.ts hook
    - Implement optimistic create/update/delete for feed records
    - Follow same pattern as batch mutations
    - _Requirements: 5.1_
  - [x] 5.2 Create app/features/mortality/use-mortality-mutations.ts hook
    - Implement optimistic create/update/delete for mortality records
    - _Requirements: 5.2_
  - [x] 5.3 Create app/features/weights/use-weight-mutations.ts hook
    - Implement optimistic create/update/delete for weight samples
    - _Requirements: 5.3_
  - [x] 5.4 Create app/features/water-quality/use-water-quality-mutations.ts hook
    - Implement optimistic create/update/delete for water quality records
    - _Requirements: 5.4_
  - [x] 5.5 Create app/features/eggs/use-egg-mutations.ts hook
    - Implement optimistic create/update/delete for egg production records
    - _Requirements: 5.5_
  - [x] 5.6 Create app/features/vaccinations/use-vaccination-mutations.ts hook
    - Implement optimistic create/update/delete for vaccination records
    - _Requirements: 5.6_

- [x] 6. Add Optimistic Updates to Transaction Mutations
  - [x] 6.1 Create app/features/sales/use-sales-mutations.ts hook
    - Implement optimistic create/update/delete for sales records
    - _Requirements: 6.1_
  - [x] 6.2 Create app/features/expenses/use-expense-mutations.ts hook
    - Implement optimistic create/update/delete for expense records
    - _Requirements: 6.2_
  - [x] 6.3 Create app/features/invoices/use-invoice-mutations.ts hook
    - Implement optimistic create/update/delete for invoices
    - Include payment status updates
    - _Requirements: 6.3, 6.4_

- [x] 7. Checkpoint - Verify mutation hooks
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add Optimistic Updates to Farm Management Mutations
  - [x] 8.1 Create app/features/customers/use-customer-mutations.ts hook
    - Implement optimistic create/update/delete for customer records
    - _Requirements: 7.1_
  - [x] 8.2 Create app/features/suppliers/use-supplier-mutations.ts hook
    - Implement optimistic create/update/delete for supplier records
    - _Requirements: 7.2_
  - [x] 8.3 Create app/features/structures/use-structure-mutations.ts hook
    - Implement optimistic create/update/delete for farm structures
    - _Requirements: 7.3_
  - [x] 8.4 Create app/features/tasks/use-task-mutations.ts hook
    - Implement optimistic create/update/complete for tasks
    - _Requirements: 7.5_

- [x] 9. Enhance Sync Status Component
  - [x] 9.1 Update app/components/sync-status.tsx with accurate pending count
    - Subscribe to mutation cache changes using `useMutationState()`
    - Count mutations with status 'pending' or isPaused: true
    - Add failed mutation count tracking
    - Add retry button for failed mutations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 9.2 Write property test for pending count accuracy
    - **Property 7: Pending Count Accuracy**
    - **Validates: Requirements 3.2**

- [x] 10. Fix Service Worker Registration
  - [x] 10.1 Update app/components/pwa-prompt.tsx with real registration
    - Replace mocked `useRegisterSW` with import from 'virtual:pwa-register/react'
    - Add `offlineReady` state handling
    - Add proper error handling for registration failures
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 10.2 Update vite.config.ts PWA configuration if needed
    - Verify Workbox runtime caching configuration
    - Ensure all static assets are cached
    - _Requirements: 9.4, 9.5_

- [x] 11. Checkpoint - Verify PWA functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add Online-Required Guard Component
  - [x] 12.1 Create app/components/online-required.tsx component
    - Implement `OnlineRequired` wrapper component
    - Create `OfflineFeatureMessage` component with feature-specific messages
    - Support features: 'auth', 'shared-formulation', 'credit-passport', 'iot-sensors'
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 12.2 Wrap online-only features with OnlineRequired
    - Wrap login/signup routes
    - Wrap shared formulation view
    - Wrap Credit Passport generation
    - Wrap IoT sensor pages
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 13. Implement Conflict Resolution
  - [x] 13.1 Add conflict detection to server functions
    - Add `updatedAt` comparison in update server functions
    - Return 409 Conflict when server version is newer
    - Include both versions in conflict response
    - _Requirements: 8.1_
  - [x] 13.2 Add last-write-wins resolution in mutation hooks
    - Handle 409 responses by comparing timestamps
    - Retry with merged data if client is newer
    - Accept server version if server is newer
    - _Requirements: 8.2_
  - [x] 13.3 Add orphaned mutation handling
    - Handle 404 responses by removing mutation from queue
    - Log warning for debugging
    - _Requirements: 8.3_
  - [x] 13.4 Write property test for conflict resolution
    - **Property 8: Conflict Resolution**
    - **Validates: Requirements 8.1, 8.2**

- [x] 14. Add Mutation Persistence Tests
  - [x] 14.1 Write property test for mutation persistence round-trip
    - **Property 2: Mutation Persistence Round-Trip**
    - **Validates: Requirements 1.2, 1.3**
  - [x] 14.2 Write property test for mutation order preservation
    - **Property 3: Mutation Order Preservation**
    - **Validates: Requirements 1.4**
  - [x] 14.3 Write property test for mutation preservation invariant
    - **Property 9: Mutation Preservation Invariant**
    - **Validates: Requirements 8.5**

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement Temp ID Resolution Chain
  - [x] 16.1 Create app/lib/temp-id-resolver.ts
    - Implement `TempIdResolver` class with register/resolve/clear methods
    - Implement `generateTempId(entityType)` with entity-prefixed format
    - Implement `isTempId(id)` helper function
    - Store mappings in memory with IndexedDB backup
    - _Requirements: 11.1, 11.3_
  - [x] 16.2 Integrate temp ID resolver into mutation success handlers
    - Update all `onSuccess` handlers to register temp ID → server ID mappings
    - Call `tempIdResolver.register()` when server returns real ID
    - _Requirements: 11.1_
  - [x] 16.3 Implement pending mutation update logic
    - Scan mutation queue for references to resolved temp IDs
    - Update mutation variables with server IDs before execution
    - Handle nested references (e.g., sale.batchId, feedRecord.batchId)
    - _Requirements: 11.2, 11.4_
  - [x] 16.4 Add blocked mutation handling
    - Detect when parent record sync fails
    - Mark dependent mutations as blocked
    - Show user notification with blocked mutation details
    - _Requirements: 11.5_
  - [x] 16.5 Write property tests for temp ID resolution
    - **Property 11: Temp ID Resolution Propagation**
    - **Property 12: Temp ID Mapping Completeness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [x] 17. Implement Mutation Deduplication
  - [x] 17.1 Create app/lib/mutation-deduplicator.ts
    - Implement `MutationMeta` extraction from TanStack Query mutations
    - Implement `deduplicateMutations()` core algorithm
    - Group mutations by entityId for efficient processing
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 17.2 Implement create-delete cancellation
    - Detect create + delete pairs for same temp ID
    - Remove both mutations from queue
    - Log deduplication for debugging
    - _Requirements: 12.1, 12.5_
  - [x] 17.3 Implement update merging
    - Detect multiple updates to same entity
    - Merge into single update with latest field values
    - Preserve timestamp of latest update
    - _Requirements: 12.3_
  - [x] 17.4 Implement update-delete optimization
    - Detect update + delete sequences
    - Remove update mutations, keep only delete
    - _Requirements: 12.2_
  - [x] 17.5 Add deduplication hook to sync process
    - Run deduplication before executing pending mutations
    - Create `useDeduplicatedSync()` hook
    - _Requirements: 12.4_
  - [x] 17.6 Write property tests for deduplication
    - **Property 13: Create-Delete Cancellation**
    - **Property 14: Update Merge Correctness**
    - **Validates: Requirements 12.1, 12.3, 12.4**

- [x] 18. Implement Storage Quota Monitoring
  - [x] 18.1 Create app/lib/storage-monitor.ts
    - Implement `useStorageMonitor()` hook with configurable thresholds
    - Implement `formatBytes()` utility function
    - Add graceful degradation when API unavailable
    - _Requirements: 13.1, 13.6_
  - [x] 18.2 Add storage status to sync status component
    - Display storage percentage in sync status panel
    - Show warning icon when above 70%
    - Show critical alert when above 85%
    - _Requirements: 13.2, 13.3, 13.5_
  - [x] 18.3 Implement mutation blocking at 95%
    - Check storage before queuing new mutations
    - Reject mutations when storage critical
    - Show "Sync Required" modal with explanation
    - _Requirements: 13.4_
  - [x] 18.4 Add storage usage to settings page
    - Display current usage / quota
    - Add "Clear Cache" option for non-essential data
    - Add "Sync Now" button
    - _Requirements: 13.5_
  - [x] 18.5 Write property tests for storage monitoring
    - **Property 15: Storage Threshold Accuracy**
    - **Property 16: Storage Block Enforcement**
    - **Validates: Requirements 13.1, 13.4, 13.5**

- [x] 19. Final Integration Checkpoint
  - Test complete offline workflow: create batch → record feed → record sale → sync
  - Verify temp ID resolution works across entity types
  - Verify deduplication handles rapid create-update-delete
  - Verify storage warnings appear at correct thresholds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive offline functionality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TanStack Query's built-in offline support rather than introducing new libraries
- **Tasks 16-19 address edge cases**: temp ID chains, mutation deduplication, and storage limits
- Temp ID format uses entity prefix for easier debugging: `temp-batch-uuid`, `temp-sale-uuid`
- Storage monitoring gracefully degrades on browsers without `navigator.storage.estimate()`
