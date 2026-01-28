# Implementation Plan: Production Readiness Fixes

## Overview

This implementation plan addresses critical bugs, security gaps, form-schema mismatches, and mobile responsiveness issues. Tasks are organized to fix critical issues first, then enhance forms, and finally address UI/UX improvements.

## Tasks

- [x]   1. Fix Critical Bug in Expense Server
    - [x] 1.1 Remove duplicate return statement in deleteExpenseFn handler
        - Open `app/lib/expenses/server.ts`
        - Locate lines 130-131 in deleteExpenseFn handler
        - Remove the duplicate `return deleteExpense(session.user.id, data.expenseId)` line
        - _Requirements: 1.1_

- [x]   2. Enhance Sale Dialog with Missing Fields
    - [x] 2.1 Add server function to fetch customers for sale dialog
        - Create getCustomersForSaleFn in sale-dialog.tsx
        - Fetch customers ordered by name
        - _Requirements: 3.1_
    - [x] 2.2 Add new form state fields to sale dialog
        - Add customerId, unitType, ageWeeks, averageWeightKg, paymentStatus, paymentMethod to formData
        - Set paymentStatus default to 'paid'
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
    - [x] 2.3 Add collapsible Additional Details section to sale dialog
        - Import Collapsible components
        - Add customer selector dropdown
        - Add unit type selector (bird, kg, crate, piece)
        - Add age weeks input (show only for poultry)
        - Add average weight input
        - Add payment status selector (paid, pending, partial)
        - Add payment method selector (cash, transfer, credit)
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
    - [x] 2.4 Update form submission to include all new fields
        - Pass all new fields to createSaleFn
        - Handle null/undefined for optional fields
        - _Requirements: 3.7_
    - [ ]\* 2.5 Write property test for sale form data completeness
        - **Property 1: Sale Form Data Completeness**
        - **Validates: Requirements 3.7**

- [x]   3. Enhance Expense Dialog with Batch Selector
    - [x] 3.1 Add server function to fetch batches for expense dialog
        - Create getBatchesForExpenseFn in expense-dialog.tsx
        - Fetch active batches for the farm
        - _Requirements: 4.1_
    - [x] 3.2 Add batchId to expense form state
        - Add batchId field to formData
        - Initialize as empty string
        - _Requirements: 4.1_
    - [x] 3.3 Add batch selector UI to expense dialog
        - Add optional batch dropdown after category selector
        - Show batch species and livestock type in options
        - _Requirements: 4.1_
    - [x] 3.4 Update form submission to include batchId
        - Pass batchId to createExpenseFn
        - Handle null for unselected batch
        - _Requirements: 4.2_
    - [ ]\* 3.5 Write property test for expense batch association
        - **Property 2: Expense Batch Association**
        - **Validates: Requirements 4.2**

- [x]   4. Enhance Feed Dialog with Missing Fields
    - [x] 4.1 Add server function to fetch suppliers for feed dialog
        - Create getSuppliersForFeedFn in feed-dialog.tsx
        - Fetch suppliers ordered by name
        - _Requirements: 5.4_
    - [x] 4.2 Add new form state fields to feed dialog
        - Add brandName, bagSizeKg, numberOfBags, supplierId, notes to formData
        - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
    - [x] 4.3 Add collapsible Additional Details section to feed dialog
        - Add brand name text input
        - Add bag size input (kg)
        - Add number of bags input
        - Add supplier selector dropdown
        - Add notes textarea
        - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
    - [x] 4.4 Update form submission to include all new fields
        - Pass all new fields to createFeedRecordFn
        - Handle null/undefined for optional fields
        - _Requirements: 5.6_
    - [ ]\* 4.5 Write property test for feed record data completeness
        - **Property 3: Feed Record Data Completeness**
        - **Validates: Requirements 5.6**

- [x]   5. Checkpoint - Verify form enhancements
    - Ensure all tests pass, ask the user if questions arise.

- [x]   6. Fix Customer Route Anti-Patterns
    - [x] 6.1 Replace window.location.reload() with router.invalidate()
        - Open `app/routes/_auth.customers.$customerId.tsx`
        - In handleEditSubmit, replace `window.location.reload()` with `router.invalidate()`
        - _Requirements: 6.1, 6.2_
    - [x] 6.2 Improve customer not found error page
        - Add proper error styling with Card component
        - Add back navigation button
        - Add helpful message
        - _Requirements: 6.3_

- [x]   7. Fix Dashboard Mobile Responsiveness
    - [x] 7.1 Add overflow-x-hidden to dashboard container
        - Open dashboard route file
        - Add `overflow-x-hidden` class to main container
        - _Requirements: 7.1_
    - [x] 7.2 Fix stats card grid for mobile
        - Update grid classes to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
        - Add `min-w-0` to card containers to allow shrinking
        - _Requirements: 7.2, 7.3_
    - [x] 7.3 Add horizontal scroll container for tables
        - Wrap data tables in `overflow-x-auto` container
        - Ensure table doesn't cause page-level horizontal scroll
        - _Requirements: 7.4_

- [x]   8. Fix General Mobile Layout Issues
    - [x] 8.1 Audit and fix dialog mobile sizing
        - Review all dialogs for mobile viewport fit
        - Ensure `max-h-[85vh]` and `overflow-y-auto` are applied
        - Add responsive padding adjustments
        - _Requirements: 8.2_
    - [x] 8.2 Fix form field stacking on mobile
        - Review grid layouts in forms
        - Ensure `grid-cols-1 sm:grid-cols-2` pattern is used
        - _Requirements: 8.3_
    - [x] 8.3 Verify navigation mobile responsiveness
        - Check navigation component for overflow issues
        - Ensure mobile menu works correctly
        - _Requirements: 8.4_

- [x]   9. Fix Database Errors
    - [x] 9.1 Fix customers page column name error
        - Changed `sales.total_amount` to `sales."totalAmount"` in customers server
        - _Requirements: 1.1_
    - [x] 9.2 Fix invoices page database connection error
        - Converted all functions in invoices server to use dynamic db imports
        - Removed top-level db import that was causing client-side initialization
        - Fixed TypeScript error in getInvoicesPaginated sortBy logic
        - _Requirements: 1.1_

- [x]   10. Final Checkpoint - Production Readiness Verification
    - Ensure all tests pass
    - Manually test on mobile viewport (375px, 390px widths)
    - Verify no horizontal scroll on any page
    - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Mobile responsiveness tasks require manual visual verification
