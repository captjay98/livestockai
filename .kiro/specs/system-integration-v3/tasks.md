# Implementation Plan: System Integration v3

## Overview

This plan implements system integration improvements including automated feed inventory management, complete CRUD operations, dark mode fixes, and improved data relationships.

## Tasks

- [x] 1. Feed Inventory Auto-Deduction
  - [x] 1.1 Update createFeedRecord to deduct from feed_inventory
    - Add transaction to deduct quantity from matching feed_inventory record
    - Create feed_inventory record if it doesn't exist
    - _Requirements: 1.1_
  - [x] 1.2 Update deleteFeedRecord to restore feed_inventory
    - Add transaction to restore quantity to feed_inventory
    - _Requirements: 1.2_
  - [x] 1.3 Add low stock detection after deduction
    - Check if quantity < minThresholdKg after deduction
    - Return low stock warning in response
    - _Requirements: 1.4_
  - [ ] 1.4 Write property test for feed inventory deduction
    - **Property 1: Feed Inventory Deduction Consistency**
    - **Validates: Requirements 1.1**
  - [ ] 1.5 Write property test for feed inventory restoration
    - **Property 2: Feed Inventory Restoration on Delete**
    - **Validates: Requirements 1.2**

- [x] 2. Customer CRUD Operations
  - [x] 2.1 Create customer detail page route
    - Create app/routes/_auth.customers.$customerId.tsx
    - Show customer info, sales history, total purchases
    - _Requirements: 2.1_
  - [x] 2.2 Add edit customer dialog
    - Create EditCustomerDialog component
    - Pre-fill with existing customer data
    - _Requirements: 2.2_
  - [x] 2.3 Add delete customer with confirmation
    - Add delete button with confirmation dialog
    - Check for associated sales before deletion
    - _Requirements: 2.3, 2.4_
  - [x] 2.4 Update customers list with working View/Edit/Delete buttons
    - Wire up action buttons to dialogs and navigation
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Supplier CRUD Operations
  - [x] 3.1 Fix supplier detail page navigation
    - Ensure View button navigates to existing detail page
    - _Requirements: 3.1_
  - [x] 3.2 Add edit supplier dialog
    - Create EditSupplierDialog component
    - Pre-fill with existing supplier data
    - _Requirements: 3.2_
  - [x] 3.3 Add delete supplier with confirmation
    - Add delete button with confirmation dialog
    - Check for associated expenses/batches before deletion
    - _Requirements: 3.3, 3.4_
  - [x] 3.4 Update suppliers list with working Edit/Delete buttons
    - Wire up action buttons to dialogs
    - _Requirements: 3.2, 3.3_

- [x] 4. Invoice Management
  - [x] 4.1 Create invoice dialog component
    - Create app/routes/_auth.invoices.new.tsx (already exists)
    - Support creating invoice with line items
    - Support linking to existing sale
    - _Requirements: 4.1, 4.5_
  - [x] 4.2 Add edit invoice status dialog
    - Create status update dialog
    - Allow changing payment status
    - _Requirements: 4.3_
  - [x] 4.3 Add delete invoice with confirmation
    - Add delete button with confirmation dialog
    - Unlink from sale if linked
    - _Requirements: 4.4_
  - [x] 4.4 Wire up Create Invoice button on invoices page
    - Connect button to invoice creation page
    - _Requirements: 4.1_

- [x] 5. Dark Mode Styling Fixes
  - [x] 5.1 Fix water quality alerts dark mode
    - Update alert card backgrounds to use theme-aware classes
    - Update text colors for proper contrast
    - _Requirements: 5.1, 5.3_
  - [x] 5.2 Fix weight growth alerts dark mode
    - Update alert card backgrounds to use theme-aware classes
    - Update text colors for proper contrast
    - _Requirements: 5.2, 5.3_

- [x] 6. Seed Data Completeness
  - [x] 6.1 Verify customers are seeded (already in seed.ts)
    - Check seed script creates customers
    - _Requirements: 6.1_
  - [x] 6.2 Add feed inventory seed data
    - Create feed_inventory records for each farm
    - Set realistic quantities and thresholds
    - _Requirements: 6.3_
  - [x] 6.3 Verify invoices are seeded (already in seed.ts)
    - Check seed script creates invoices linked to sales
    - _Requirements: 6.2_

- [x] 7. Feed Type Improvements
  - [x] 7.1 Create feed type constants with labels
    - Add FEED_TYPE_LABELS mapping
    - Add livestock-specific feed type arrays
    - _Requirements: 7.1, 7.2_
  - [ ] 7.2 Update feed forms to use labels and filtering
    - Show human-readable labels in dropdowns
    - Filter options based on batch livestock type
    - _Requirements: 7.1, 7.3_
  - [ ] 7.3 Write property test for feed type labels
    - **Property 7: Feed Type Label Completeness**
    - **Validates: Requirements 7.1**

- [x] 8. Batch-Structure-Farm Display
  - [x] 8.1 Update batch list to show structure and farm
    - Add structure name column
    - Add farm name column (when viewing all farms)
    - _Requirements: 8.4_
  - [x] 8.2 Update batch detail to show structure and farm
    - Display structure name with link
    - Display farm name with link
    - _Requirements: 8.1, 8.2_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
