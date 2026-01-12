# Implementation Plan: Admin Data Management & Permission Enforcement

## Overview

This implementation plan covers adding admin GUI for reference data (growth standards, market prices) and enforcing farm-level role permissions throughout the application. The work is organized into four phases: permission infrastructure, permission enforcement, admin data UI, and UI permission awareness.

## Tasks

- [ ] 1. Create Permission Infrastructure
  - [ ] 1.1 Create PermissionError class in `app/lib/auth/permissions.ts`
    - Create custom error class with statusCode (403) and permission property
    - Include descriptive error message
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 1.2 Create requirePermission helper function
    - Import hasPermission from utils
    - Throw PermissionError if permission check fails
    - _Requirements: 6.1_

  - [ ] 1.3 Create getUserPermissionsFn server function
    - Accept farmId parameter
    - Return array of permissions for current user on that farm
    - Use requireAuth for session
    - _Requirements: 7.5_

  - [ ] 1.4 Write property test for permission error format
    - **Property 10: Permission Error Format**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 2. Enforce Permissions in Batch Operations
  - [ ] 2.1 Update createBatch to check batch:create permission
    - Import requirePermission
    - Call before database operation
    - _Requirements: 3.1, 3.6_

  - [ ] 2.2 Update updateBatch to check batch:update permission
    - Fetch batch to get farmId first
    - Check permission before update
    - _Requirements: 3.2, 3.6_

  - [ ] 2.3 Update deleteBatch to check batch:delete permission
    - Fetch batch to get farmId first
    - Check permission before delete
    - _Requirements: 3.3, 3.4_

  - [ ] 2.4 Write property test for viewer role blocks batch writes
    - **Property 6: Viewer Role Blocks Writes (batch portion)**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ] 2.5 Write property test for manager role blocks batch deletes
    - **Property 7: Manager Role Blocks Deletes (batch portion)**
    - **Validates: Requirements 3.4**

  - [ ] 2.6 Write property test for owner role full batch access
    - **Property 8: Owner Role Full Access (batch portion)**
    - **Validates: Requirements 3.5**

- [ ] 3. Checkpoint - Ensure batch permission tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Enforce Permissions in Financial Operations
  - [ ] 4.1 Update createSale to check finance:create permission
    - Import requirePermission
    - Call before database operation
    - _Requirements: 4.1, 4.6_

  - [ ] 4.2 Update deleteSale to check finance:delete permission
    - Fetch sale to get farmId first
    - Check permission before delete
    - _Requirements: 4.3_

  - [ ] 4.3 Update createExpense to check finance:create permission
    - Import requirePermission
    - Call before database operation
    - _Requirements: 4.2, 4.6_

  - [ ] 4.4 Update deleteExpense to check finance:delete permission
    - Fetch expense to get farmId first
    - Check permission before delete
    - _Requirements: 4.4_

  - [ ] 4.5 Write property test for viewer role blocks finance writes
    - **Property 6: Viewer Role Blocks Writes (finance portion)**
    - **Validates: Requirements 4.1, 4.2**

  - [ ] 4.6 Write property test for manager role blocks finance deletes
    - **Property 7: Manager Role Blocks Deletes (finance portion)**
    - **Validates: Requirements 4.3, 4.4**

- [ ] 5. Enforce Permissions in Farm Operations
  - [ ] 5.1 Update updateFarm to check farm:update permission
    - Check permission before update
    - _Requirements: 5.1, 5.6_

  - [ ] 5.2 Update deleteFarm to check farm:delete permission
    - Check permission before delete
    - _Requirements: 5.2_

  - [ ] 5.3 Write property test for farm permission enforcement
    - **Property 6, 7, 8: Role-based farm access**
    - **Validates: Requirements 5.1, 5.2, 5.5, 5.6**

- [ ] 6. Checkpoint - Ensure all permission tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create Reference Data Server Functions
  - [ ] 7.1 Create `app/lib/reference-data/server.ts` with growth standards functions
    - getGrowthStandards - list all, ordered by species and day
    - updateGrowthStandard - update weight for existing entry
    - addGrowthStandard - add new day/weight entry
    - deleteGrowthStandard - remove entry
    - All require admin role
    - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.7_

  - [ ] 7.2 Add market prices functions to reference-data/server.ts
    - getMarketPrices - list all, grouped by species
    - updateMarketPrice - update price for existing entry
    - addMarketPrice - add new entry with validation
    - deleteMarketPrice - remove entry
    - All require admin role
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

  - [ ] 7.3 Write property test for admin page access control
    - **Property 1: Admin Page Access Control**
    - **Validates: Requirements 1.1, 2.1**

  - [ ] 7.4 Write property test for positive number validation
    - **Property 2: Positive Number Validation**
    - **Validates: Requirements 1.4, 2.3**

  - [ ] 7.5 Write property test for reference data round-trip
    - **Property 3: Reference Data Round-Trip**
    - **Validates: Requirements 1.5, 2.4**

- [ ] 8. Create Growth Standards Admin Page
  - [ ] 8.1 Create `app/routes/_auth.settings.growth-standards.tsx`
    - Admin-only route with redirect
    - Load growth standards in loader
    - _Requirements: 1.1, 1.2_

  - [ ] 8.2 Implement species selector and data table
    - Tabs or dropdown for species selection
    - Editable table with day and weight columns
    - Delete button per row
    - _Requirements: 1.3, 1.7_

  - [ ] 8.3 Implement growth curve chart
    - Line chart showing weight vs day
    - Update when species changes
    - _Requirements: 1.8_

  - [ ] 8.4 Implement save and add functionality
    - Save button to persist all changes
    - Add button to insert new day entry
    - Validation for positive numbers
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 9. Create Market Prices Admin Page
  - [ ] 9.1 Create `app/routes/_auth.settings.market-prices.tsx`
    - Admin-only route with redirect
    - Load market prices in loader
    - _Requirements: 2.1, 2.2_

  - [ ] 9.2 Implement grouped price table
    - Group by species with collapsible sections
    - Editable price fields
    - Show last updated timestamp
    - Delete button per row
    - _Requirements: 2.2, 2.6, 2.7_

  - [ ] 9.3 Implement add price dialog
    - Form with species, size category, price fields
    - Validation for required fields
    - _Requirements: 2.5_

  - [ ] 9.4 Implement save functionality
    - Save button to persist all changes
    - Validation for positive numbers
    - _Requirements: 2.3, 2.4_

- [ ] 10. Update Settings Navigation
  - [ ] 10.1 Add Growth Standards and Market Prices to settings nav
    - Add to settingsNav array in \_auth.settings.tsx
    - Mark as adminOnly: true
    - Use appropriate icons (TrendingUp, DollarSign)
    - _Requirements: 1.1, 2.1_

- [ ] 11. Checkpoint - Ensure admin pages work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Create Client-Side Permission Hook
  - [ ] 12.1 Create `app/hooks/use-permissions.ts`
    - useQuery to fetch permissions for farmId
    - Cache for 5 minutes (staleTime)
    - Helper methods: can(), canCreateBatch, canDeleteBatch, etc.
    - _Requirements: 7.5_

- [ ] 13. Update UI Components for Permission Awareness
  - [ ] 13.1 Update batch list to use permissions
    - Hide/disable Add Batch button if no batch:create permission
    - Hide/disable delete option if no batch:delete permission
    - _Requirements: 7.1, 7.2_

  - [ ] 13.2 Update sales/expense forms to use permissions
    - Hide/disable Add Sale/Expense buttons if no finance:create permission
    - Hide/disable delete options if no finance:delete permission
    - _Requirements: 7.3_

  - [ ] 13.3 Update farm settings to use permissions
    - Hide member management if no member:invite permission
    - _Requirements: 7.4_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All property-based tests are required
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Permission enforcement should be added to ALL write operations, not just the ones listed
- The usePermissions hook should be used consistently across all farm-scoped pages
