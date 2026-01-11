# Requirements Document

## Introduction

This specification addresses critical bugs, form-schema mismatches, security gaps, and mobile responsiveness issues identified during the production readiness audit of the JayFarms application. The goal is to ensure the application is stable, secure, and provides a consistent user experience across all devices before production deployment.

## Glossary

- **Sale_Dialog**: The dialog component for recording livestock and egg sales
- **Expense_Dialog**: The dialog component for recording farm expenses
- **Feed_Dialog**: The dialog component for recording feed usage
- **Customer_Server**: The server-side module handling customer CRUD operations
- **Expense_Server**: The server-side module handling expense CRUD operations
- **Dashboard**: The main overview page showing farm statistics and metrics
- **Form_Field**: An input element in a dialog that captures user data
- **DB_Schema**: The database table structure defining available columns

## Requirements

### Requirement 1: Fix Critical Code Bugs

**User Story:** As a developer, I want all code bugs fixed, so that the application runs without errors.

#### Acceptance Criteria

1. WHEN the deleteExpenseFn handler executes, THE Expense_Server SHALL contain only one return statement
2. WHEN any server function is called, THE System SHALL not have duplicate code that could cause unexpected behavior

---

### Requirement 2: Enhance Sale Dialog Form Fields

**User Story:** As a farm manager, I want to capture complete sale information, so that I can track payment status, customer details, and sale metrics.

#### Acceptance Criteria

1. WHEN recording a sale, THE Sale_Dialog SHALL provide an optional customer selector populated from existing customers
2. WHEN recording a sale, THE Sale_Dialog SHALL provide a unit type selector with options: bird, kg, crate, piece
3. WHEN recording a poultry sale, THE Sale_Dialog SHALL provide an optional age in weeks field
4. WHEN recording a sale, THE Sale_Dialog SHALL provide an optional average weight field
5. WHEN recording a sale, THE Sale_Dialog SHALL provide a payment status selector with options: paid, pending, partial (defaulting to paid)
6. WHEN recording a sale, THE Sale_Dialog SHALL provide a payment method selector with options: cash, transfer, credit
7. WHEN the form is submitted, THE Sale_Dialog SHALL pass all captured fields to the createSaleFn server function

---

### Requirement 3: Enhance Expense Dialog Form Fields

**User Story:** As a farm manager, I want to link expenses to specific batches, so that I can track costs per batch accurately.

#### Acceptance Criteria

1. WHEN recording an expense, THE Expense_Dialog SHALL provide an optional batch selector populated from active batches
2. WHEN a batch is selected, THE Expense_Dialog SHALL pass the batchId to the createExpenseFn server function
3. WHEN the expense category is feed, THE Expense_Dialog SHALL show additional fields for feed type and quantity

---

### Requirement 4: Enhance Feed Dialog Form Fields

**User Story:** As a farm manager, I want to capture detailed feed information, so that I can track feed brands, quantities, and suppliers.

#### Acceptance Criteria

1. WHEN recording feed usage, THE Feed_Dialog SHALL provide an optional brand name text field
2. WHEN recording feed usage, THE Feed_Dialog SHALL provide an optional bag size field in kg
3. WHEN recording feed usage, THE Feed_Dialog SHALL provide an optional number of bags field
4. WHEN recording feed usage, THE Feed_Dialog SHALL provide an optional supplier selector
5. WHEN recording feed usage, THE Feed_Dialog SHALL provide an optional notes field
6. WHEN the form is submitted, THE Feed_Dialog SHALL pass all captured fields to the createFeedRecordFn server function

---

### Requirement 5: Fix Customer Route Anti-Patterns

**User Story:** As a user, I want smooth navigation after editing customers, so that I don't experience jarring page reloads.

#### Acceptance Criteria

1. WHEN a customer is successfully updated, THE Customer_Detail_Page SHALL use router.invalidate() instead of window.location.reload()
2. WHEN a customer is successfully updated, THE Customer_Detail_Page SHALL maintain scroll position and UI state
3. WHEN a customer is not found, THE Customer_Detail_Page SHALL display a proper error page with back navigation

---

### Requirement 6: Fix Dashboard Mobile Responsiveness

**User Story:** As a mobile user, I want the dashboard to display properly on small screens, so that I can view all statistics without horizontal scrolling.

#### Acceptance Criteria

1. WHEN viewing the dashboard on mobile devices (width < 768px), THE Dashboard SHALL not have horizontal overflow
2. WHEN viewing statistic cards on mobile, THE Dashboard SHALL display cards in a single column or properly wrapped grid
3. WHEN viewing the mortality, customers, and other metric cards, THE Dashboard SHALL constrain card widths to fit within the viewport
4. WHEN viewing tables on mobile, THE Dashboard SHALL provide horizontal scroll within the table container only, not the entire page

---

### Requirement 7: Fix General Mobile Layout Issues

**User Story:** As a mobile user, I want all pages to be responsive, so that I can use the application comfortably on my phone.

#### Acceptance Criteria

1. WHEN viewing any page on mobile, THE System SHALL not have content that overflows the viewport horizontally
2. WHEN viewing dialogs on mobile, THE System SHALL ensure dialogs fit within the screen with proper padding
3. WHEN viewing forms on mobile, THE System SHALL stack form fields vertically when horizontal space is insufficient
4. WHEN viewing navigation on mobile, THE System SHALL provide accessible navigation without horizontal overflow
