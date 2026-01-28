# Requirements Document

## Introduction

This specification standardizes all "Add/Create" actions across the application to use inline dialogs instead of separate page routes. Currently, the application has an inconsistent pattern where some entities use dialogs (mortality, sales, weight, water-quality) while others navigate to separate `/new` pages. This creates a fragmented user experience and increases code complexity with redundant route files.

## Glossary

- **Dialog**: A modal overlay component that appears on top of the current page, allowing users to complete an action without navigating away
- **Page_Route**: A separate URL/route that renders a full page for a specific action
- **List_Page**: The main page displaying a table/list of records for an entity (e.g., `/invoices`, `/customers`)
- **Add_Action**: The user action to create a new record of an entity
- **Form_State**: The collection of input values and validation state for a create/edit form

## Requirements

### Requirement 1: Invoice Creation Dialog

**User Story:** As a user, I want to create invoices from a dialog on the invoices list page, so that I can quickly add invoices without losing my place in the list.

#### Acceptance Criteria

1. WHEN a user clicks "Create Invoice" on the invoices list page, THE Dialog SHALL open with the invoice creation form
2. WHEN the invoice dialog opens, THE System SHALL load customers and farms data for the dropdown selections
3. WHEN a user adds invoice line items, THE Dialog SHALL display a running total of all items
4. WHEN a user submits a valid invoice form, THE System SHALL create the invoice and close the dialog
5. WHEN a user cancels the dialog, THE System SHALL discard form data and close the dialog without creating a record
6. WHEN the invoice is successfully created, THE List_Page SHALL refresh to show the new invoice

### Requirement 2: Batch Creation Dialog

**User Story:** As a user, I want to create batches from a dialog on the batches list page, so that I can quickly add livestock batches without navigating away.

#### Acceptance Criteria

1. WHEN a user clicks "Add Batch" on the batches list page, THE Dialog SHALL open with the batch creation form
2. WHEN the batch dialog opens, THE System SHALL display livestock type and species selection options
3. WHEN a user changes livestock type, THE System SHALL update the species options accordingly
4. WHEN a user enters quantity and cost per unit, THE Dialog SHALL display a calculated total cost
5. WHEN a user submits a valid batch form, THE System SHALL create the batch and close the dialog
6. WHEN the batch is successfully created, THE List_Page SHALL refresh to show the new batch

### Requirement 3: Customer Creation Dialog

**User Story:** As a user, I want to create customers from a dialog on the customers list page, so that I can quickly add customer records without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Customer" on the customers list page, THE Dialog SHALL open with the customer creation form
2. THE Dialog SHALL include a customer type selection (individual, restaurant, retailer, wholesaler)
3. WHEN a user submits a valid customer form, THE System SHALL create the customer and close the dialog
4. WHEN the customer is successfully created, THE List_Page SHALL refresh to show the new customer

### Requirement 4: Supplier Creation Dialog

**User Story:** As a user, I want to create suppliers from a dialog on the suppliers list page, so that I can quickly add supplier records without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Supplier" on the suppliers list page, THE Dialog SHALL open with the supplier creation form
2. THE Dialog SHALL include a supplier type selection (hatchery, feed_mill, pharmacy, equipment, fingerlings, other)
3. WHEN a user submits a valid supplier form, THE System SHALL create the supplier and close the dialog
4. WHEN the supplier is successfully created, THE List_Page SHALL refresh to show the new supplier

### Requirement 5: Expense Creation Dialog

**User Story:** As a user, I want to create expenses from a dialog on the expenses list page, so that I can quickly record expenses without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Expense" on the expenses list page, THE Dialog SHALL open with the expense creation form
2. WHEN the expense dialog opens, THE System SHALL load farms, categories, batches, and suppliers for selection
3. WHEN a user selects a category, THE System SHALL optionally allow linking to a batch
4. WHEN a user submits a valid expense form, THE System SHALL create the expense and close the dialog
5. WHEN the expense is successfully created, THE List_Page SHALL refresh to show the new expense

### Requirement 6: Feed Record Creation Dialog

**User Story:** As a user, I want to create feed records from a dialog on the feed list page, so that I can quickly log feeding activities without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Feed Record" on the feed list page, THE Dialog SHALL open with the feed record creation form
2. WHEN the feed dialog opens, THE System SHALL load batches, feed inventory, and suppliers for selection
3. WHEN a user selects a batch, THE System SHALL filter feed types appropriate for that livestock type
4. THE Dialog SHALL include optional fields for brand name, bag size, number of bags, and notes
5. WHEN a user submits a valid feed form, THE System SHALL create the feed record and close the dialog
6. WHEN the feed record is successfully created, THE List_Page SHALL refresh to show the new record

### Requirement 7: Egg Collection Creation Dialog

**User Story:** As a user, I want to record egg collections from a dialog on the eggs list page, so that I can quickly log collections without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Collection" on the eggs list page, THE Dialog SHALL open with the egg collection form
2. WHEN the egg dialog opens, THE System SHALL load poultry batches for selection
3. WHEN a user submits a valid egg collection form, THE System SHALL create the record and close the dialog
4. WHEN the egg collection is successfully created, THE List_Page SHALL refresh to show the new record

### Requirement 8: Vaccination Record Creation Dialog

**User Story:** As a user, I want to record vaccinations from a dialog on the vaccinations list page, so that I can quickly log vaccination activities without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Vaccination" on the vaccinations list page, THE Dialog SHALL open with the vaccination form
2. WHEN the vaccination dialog opens, THE System SHALL load batches for selection
3. THE Dialog SHALL include an optional notes field
4. WHEN a user submits a valid vaccination form, THE System SHALL create the record and close the dialog
5. WHEN the vaccination is successfully created, THE List_Page SHALL refresh to show the new record

### Requirement 9: Farm Creation Dialog

**User Story:** As a user, I want to create farms from a dialog on the farms list page, so that I can quickly add new farms without page navigation.

#### Acceptance Criteria

1. WHEN a user clicks "Add Farm" on the farms list page, THE Dialog SHALL open with the farm creation form
2. THE Dialog SHALL include optional fields for contact phone and notes
3. WHEN a user submits a valid farm form, THE System SHALL create the farm and close the dialog
4. WHEN the farm is successfully created, THE List_Page SHALL refresh to show the new farm

### Requirement 10: Remove Redundant Page Routes

**User Story:** As a developer, I want to remove the redundant `/new` page routes after dialogs are implemented, so that the codebase is cleaner and more maintainable.

#### Acceptance Criteria

1. WHEN all dialogs are implemented and tested, THE System SHALL have the following route files removed:
    - `_auth.invoices.new.tsx`
    - `_auth.batches.new.tsx`
    - `_auth.customers.new.tsx`
    - `_auth.suppliers.new.tsx`
    - `_auth.expenses.new.tsx`
    - `_auth.feed.new.tsx`
    - `_auth.eggs.new.tsx`
    - `_auth.vaccinations.new.tsx`
    - `_auth.farms.new.tsx`
2. WHEN redundant routes are removed, THE System SHALL update any remaining links that pointed to those routes
3. WHEN the cleanup is complete, THE System SHALL pass all existing tests

### Requirement 11: Dialog UX Consistency

**User Story:** As a user, I want all creation dialogs to have consistent behavior and styling, so that the application feels cohesive and predictable.

#### Acceptance Criteria

1. THE Dialog components SHALL use the same width constraint (`sm:max-w-md` or `sm:max-w-lg` for complex forms)
2. THE Dialog components SHALL display a loading state while submitting
3. THE Dialog components SHALL display error messages in a consistent format
4. THE Dialog components SHALL have Cancel and Submit buttons in consistent positions
5. WHEN a dialog form has validation errors, THE System SHALL prevent submission and highlight invalid fields
